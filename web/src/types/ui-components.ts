import * as React from "react"

/**
 * Base props that all UI components should extend
 */
export interface BaseProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Button variant types
 */
export type ButtonVariant = 
  | "default" 
  | "destructive" 
  | "outline" 
  | "secondary" 
  | "ghost" 
  | "link"

/**
 * Button size types
 */
export type ButtonSize = 
  | "default" 
  | "sm" 
  | "lg" 
  | "icon"

/**
 * Props for Button component
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  className?: string
}