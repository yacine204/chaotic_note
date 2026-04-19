import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import styles from "./note.module.css"

const BIN_ID = import.meta.env.VITE_BIN_ID
const API_KEY = import.meta.env.VITE_API_KEY

const saveLatest = async (base64) => {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Master-Key": API_KEY },
        body: JSON.stringify({ latest: base64 })
    })
}

const getLatest = async () => {
    console.log("BIN:", import.meta.env.VITE_BIN_ID)
    console.log("KEY:", import.meta.env.VITE_API_KEY)
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { "X-Master-Key": API_KEY }
    })
    const data = await res.json()
    console.log(data)
    return data.record?.latest || ""
}

function Note() {
    const navigate = useNavigate()
    const { text: encodedText } = useParams()
    const [newText, setNewText] = useState(() => encodedText ? atob(encodedText) : "")
    const [isReading, setIsReading] = useState(true)
    const [loading, setLoading] = useState(!encodedText)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const isFirstRender = useRef(true)
    const readingTimer = useRef(null)
    const newlineTimer = useRef(null)

    // load latest on mount
    useEffect(() => {
        if (!encodedText) {
            getLatest().then(latest => {
                if (latest) {
                    setNewText(atob(latest))
                    navigate(`/note/${latest}`, { replace: true })
                }
                setLoading(false)
            })
        }else{
            setNewText(atob(encodedText))
            setLoading(false)
        }
    }, [encodedText])

    // reading fade timer
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

    // save on text change
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return }
        const timeout = setTimeout(() => {
            if (newText) {
                const base64 = btoa(newText)
                saveLatest(base64)
                navigate(`/note/${base64}`, { replace: true })
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
                setNewText(atob(latest))
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