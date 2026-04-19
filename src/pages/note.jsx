import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import LZString from "lz-string"
import styles from "./note.module.css"

const BIN_ID = import.meta.env.VITE_BIN_ID
const API_KEY = import.meta.env.VITE_API_KEY

const encode = (text) => LZString.compressToEncodedURIComponent(text)
const decode = (str) => LZString.decompressFromEncodedURIComponent(str) || ""

const saveLatest = async (compressed) => {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Master-Key": API_KEY },
        body: JSON.stringify({ latest: compressed })
    })
}

const getLatest = async () => {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { "X-Master-Key": API_KEY }
    })
    const data = await res.json()
    return data.record?.latest || ""
}

function Note() {
    const navigate = useNavigate()
    const { text: encodedText } = useParams()
    const [newText, setNewText] = useState(() => encodedText ? decode(encodedText) : "")
    const [isReading, setIsReading] = useState(true)
    const [loading, setLoading] = useState(!encodedText)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const isFirstRender = useRef(true)
    const readingTimer = useRef(null)
    const newlineTimer = useRef(null)

    useEffect(() => {
        if (!encodedText) {
            getLatest().then(latest => {
                if (latest) {
                    setNewText(decode(latest))
                    navigate(`/note/${latest}`, { replace: true })
                }
                setLoading(false)
            })
        } else {
            setNewText(decode(encodedText))
            setLoading(false)
        }
    }, [encodedText])

    const resetTimer = () => {
        setIsReading(false)
        clearTimeout(readingTimer.current)
        readingTimer.current = setTimeout(() => setIsReading(true), 5000)
    }

    useEffect(() => {
        readingTimer.current = setTimeout(() => setIsReading(true), 5000)
        return () => {
            clearTimeout(readingTimer.current)
            clearTimeout(newlineTimer.current)
        }
    }, [])

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return }
        const timeout = setTimeout(() => {
            if (newText) {
                const compressed = encode(newText)
                saveLatest(compressed)
                navigate(`/note/${compressed}`, { replace: true })
            }
        }, 500)
        return () => clearTimeout(timeout)
    }, [newText])

    const handleChange = (e) => {
        const val = e.target.value
        if (val.length < newText.length) return
        const added = val.slice(newText.length)
        if (added === "\n") {
            newlineTimer.current = setTimeout(() => {
                setNewText(prev => prev.slice(0, -1))
            }, 1500)
        } else {
            clearTimeout(newlineTimer.current)
        }
        setNewText(val)
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        getLatest().then(latest => {
            if (latest) {
                setNewText(decode(latest))
                navigate(`/note/${latest}`, { replace: true })
            }
            setIsRefreshing(false)
        })
    }

    if (loading) return (
        <div className={styles.outer}>
            <span className={styles.loadingText}>loading...</span>
        </div>
    )

    return (
        <div
            className={`${styles.outer} ${isReading ? styles.reading : ""}`}
            onMouseMove={resetTimer}
            onKeyDown={resetTimer}
        >
            <button
                className={`${styles.refresh} ${isRefreshing ? styles.spinning : ""}`}
                onClick={handleRefresh}
            >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M15.5 9A6.5 6.5 0 1 1 9 2.5c1.8 0 3.4.7 4.6 1.9L12 6h4V2l-1.4 1.4A8 8 0 1 0 17 9h-1.5z" fill="currentColor"/>
                </svg>
            </button>

            <div className={styles.box}>
                <textarea
                    value={newText}
                    onChange={handleChange}
                    onFocus={resetTimer}
                    className={styles.input}
                    spellCheck={false}
                />
            </div>
        </div>
    )
}

export default Note