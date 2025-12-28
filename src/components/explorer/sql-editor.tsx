'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { EditorView, keymap } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { createSqlCompletionSource, SchemaMetadata } from './sql-autocomplete'
import { cn } from '@/lib/utils'

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: SchemaMetadata
  placeholder?: string
  readOnly?: boolean
}

const STORAGE_KEY = 'sql-editor-content'
const LINE_WRAP_KEY = 'sql-line-wrap'

export function SqlEditor({
  value,
  onChange,
  schema,
  placeholder = "-- Write your SQL query here\nSELECT * FROM customers LIMIT 10;",
  readOnly = false
}: SqlEditorProps) {
  // Line wrap state with localStorage persistence
  const [lineWrap, setLineWrap] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(LINE_WRAP_KEY) === 'true'
    }
    return false
  })

  // Toggle line wrap handler
  const toggleLineWrap = useCallback(() => {
    setLineWrap(prev => !prev)
  }, [])

  // Persist line wrap preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LINE_WRAP_KEY, String(lineWrap))
    }
  }, [lineWrap])

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

  // Keyboard shortcut for Alt+Z to toggle line wrap
  const lineWrapKeymap = useMemo(() => keymap.of([{
    key: 'Alt-z',
    run: () => {
      toggleLineWrap()
      return true
    }
  }]), [toggleLineWrap])

  // Create extensions for CodeMirror - memoized to prevent unnecessary re-renders
  const extensions = useMemo(() => {
    const exts = [
      sql(),
      lineWrapKeymap,
      oneDark,
      EditorView.theme({
        '&': {
          fontSize: '14px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
        },
        '.cm-content': {
          minHeight: '200px',
          padding: '12px',
          caretColor: '#fafafa'
        },
        '.cm-focused': {
          outline: 'none'
        },
        '.cm-editor': {
          border: '1px solid var(--border)',
          borderRadius: '6px',
          backgroundColor: '#131316'
        },
        '.cm-editor.cm-focused': {
          borderColor: 'var(--primary)',
          boxShadow: '0 0 0 1px var(--primary)'
        },
        '.cm-gutters': {
          backgroundColor: '#1c1c1f',
          borderRight: '1px solid var(--border)',
          color: '#a1a1aa'
        },
        '.cm-activeLineGutter': {
          backgroundColor: '#27272a'
        },
        '.cm-activeLine': {
          backgroundColor: '#1c1c1f'
        },
        '.cm-selectionBackground': {
          backgroundColor: '#8b5cf640 !important'
        },
        '.cm-cursor': {
          borderLeftColor: '#fafafa'
        },
        '.cm-line': {
          color: '#fafafa'
        },
        '.cm-placeholder': {
          color: '#71717a'
        },
        // Syntax highlighting for dark theme
        '.cm-keyword': {
          color: '#c084fc'
        },
        '.cm-string': {
          color: '#34d399'
        },
        '.cm-number': {
          color: '#fbbf24'
        },
        '.cm-comment': {
          color: '#71717a'
        },
        '.cm-operator': {
          color: '#22d3ee'
        },
        '.cm-punctuation': {
          color: '#a1a1aa'
        },
        // Autocomplete styling
        '.cm-tooltip': {
          backgroundColor: '#131316',
          border: '1px solid #27272a',
          borderRadius: '6px'
        },
        '.cm-tooltip-autocomplete': {
          backgroundColor: '#131316'
        },
        '.cm-tooltip-autocomplete ul li': {
          color: '#fafafa'
        },
        '.cm-tooltip-autocomplete ul li[aria-selected]': {
          backgroundColor: '#8b5cf6',
          color: '#ffffff'
        },
        '.cm-completionIcon': {
          paddingRight: '0.5em'
        },
        '.cm-completionIcon-keyword:after': {
          content: '"K"',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#c084fc'
        },
        '.cm-completionIcon-variable:after': {
          content: '"T"',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#34d399'
        },
        '.cm-completionIcon-property:after': {
          content: '"C"',
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#22d3ee'
        }
      })
    ]

    // Add line wrapping extension conditionally
    if (lineWrap) {
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
  }, [lineWrap, lineWrapKeymap, schema])

  return (
    <div className="h-full flex flex-col">
      {/* Line wrap toggle indicator */}
      <div className="flex items-center justify-end px-2 py-1 border-b border-border bg-muted/30">
        <button
          onClick={toggleLineWrap}
          className={cn(
            "px-2 py-0.5 text-xs rounded transition-colors",
            lineWrap
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
          title="Toggle line wrap (Alt+Z / Option+Z)"
        >
          {lineWrap ? 'Wrap: On' : 'Wrap: Off'}
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
          theme="dark"
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
