import React from 'react'

const expressions = ['Focused', 'Warm', 'Curious', 'Reflective']

export default function ExpressionController({ value, onChange }) {
  return (
    <div className="expression-control">
      <div className="control-heading"><span>Expression</span><span className="control-value">{value}</span></div>
      <div className="expression-pills">
        {expressions.map((expression) => (
          <button key={expression} type="button" className={value === expression ? 'is-selected' : ''} onClick={() => onChange?.(expression)}>
            <span className={`expression-dot expression-dot--${expression.toLowerCase()}`} />{expression}
          </button>
        ))}
      </div>
    </div>
  )
}
