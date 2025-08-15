import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Alert } from './Alert.vue'
export { default as AlertDescription } from './AlertDescription.vue'
export { default as AlertTitle } from './AlertTitle.vue'

export const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        info: 'border-blue-500/50 bg-blue-50 text-blue-800 dark:border-blue-500/50 dark:bg-blue-900/50 dark:text-blue-200 [&>svg]:text-blue-500',
        warning: 'border-yellow-500/50 bg-yellow-50 text-yellow-800 dark:border-yellow-500/50 dark:bg-yellow-900/50 dark:text-yellow-200 [&>svg]:text-yellow-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>
