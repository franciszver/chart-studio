'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { EditorView } from '@codemirror/view'
import { WrapText } from 'lucide-react'
import { createSqlCompletionSource, SchemaMetadata } from './sql-autocomplete'

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: SchemaMetadata
  placeholder?: string
  readOnly?: boolean
}

const STORAGE_KEY = 'sql-editor-content'
const LINE_WRAP_STORAGE_KEY = 'sql-editor-line-wrap'

export function SqlEditor({
  value,
  onChange,
  schema,
  placeholder = "-- Write your SQL query here\nSELECT * FROM customers LIMIT 10;",
  readOnly = false
}: SqlEditorProps) {
  // Line wrapping state - initialize from localStorage
  const [lineWrapping, setLineWrapping] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(LINE_WRAP_STORAGE_KEY)
        return saved === 'true'
      } catch {
        return false
      }
    }
    return false
  })

  // Toggle line wrapping
  const toggleLineWrapping = useCallback(() => {
    setLineWrapping(prev => {
      const newValue = !prev
      // Persist to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(LINE_WRAP_STORAGE_KEY, String(newValue))
        } catch (error) {
          console.warn('Failed to save line wrap preference:', error)
        }
      }
      return newValue
    })
  }, [])

  // Keyboard shortcut: Alt+Z (Windows) / Option+Z (Mac) to toggle line wrapping
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Z on Windows/Linux, Option+Z on Mac
      if (event.altKey && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        toggleLineWrapping()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleLineWrapping])

  // Load content from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedContent = localStorage.getItem(STORAGE_KEY)
        if (savedContent && savedContent !== value) {
          onChange(savedContent)
        }
      } catch (error) {
        // localStorage might not be available or might be full
        console.warn('Failed to load from localStorage:', error)
      }
    }
  }, []) // Only run on mount

  // Save to localStorage when value changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage && value) {
      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch (error) {
        // localStorage might not be available or might be full
        console.warn('Failed to save to localStorage:', error)
      }
    }
  }, [value])

  // Create extensions for CodeMirror (memoized to avoid unnecessary re-renders)
  const extensions = useMemo(() => {
    const exts = [
      sql(),
      EditorView.theme({
        '&': {
          fontSize: '14px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
        },
        '.cm-content': {
          minHeight: '200px',
          padding: '12px'
        },
        '.cm-focused': {
          outline: 'none'
        },
        '.cm-editor': {
          border: '1px solid #e5e7eb',
          borderRadius: '6px'
        },
        '.cm-editor.cm-focused': {
          borderColor: '#3b82f6',
          boxShadow: '0 0 0 1px #3b82f6'
        },
        '.cm-completionIcon': {
          paddingRight: '0.5em'
        },
        '.cm-completionIcon-keyword:after': {
          content: '"K"',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#7c3aed'
        },
        '.cm-completionIcon-variable:after': {
          content: '"T"',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#059669'
        },
        '.cm-completionIcon-property:after': {
          content: '"C"',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#dc2626'
        }
      })
    ]

    // Add line wrapping extension if enabled
    if (lineWrapping) {
      exts.push(EditorView.lineWrapping)
    }

    // Add autocomplete if schema is available
    if (schema) {
      exts.push(
        autocompletion({
          override: [createSqlCompletionSource(schema)],
          activateOnTyping: true,
          maxRenderedOptions: 20,
          optionClass: () => 'cm-completion-option',
          compareCompletions: (a, b) => {
            // Prioritize exact matches, then column names, then keywords
            const aIsKeyword = a.type === 'keyword'
            const bIsKeyword = b.type === 'keyword'
            if (aIsKeyword && !bIsKeyword) return 1
            if (!aIsKeyword && bIsKeyword) return -1
            return a.label.localeCompare(b.label)
          }
        })
      )
    }

    return exts
  }, [lineWrapping, schema])

  return (
    <div className="h-full flex flex-col">
      {/* Editor Toolbar with Line Wrap Toggle */}
      <div className="flex items-center justify-end px-2 py-1 bg-gray-50 border border-gray-200 border-b-0 rounded-t-md">
        <button
          type="button"
          onClick={toggleLineWrapping}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
            lineWrapping
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={`Toggle line wrapping (Alt+Z)\nCurrently: ${lineWrapping ? 'On' : 'Off'}`}
        >
          <WrapText className="w-3.5 h-3.5" />
          <span>Wrap {lineWrapping ? 'On' : 'Off'}</span>
        </button>
      </div>
      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={extensions}
          placeholder={placeholder}
          editable={!readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: false,
            searchKeymap: true
          }}
        />
      </div>
    </div>
  )
}
