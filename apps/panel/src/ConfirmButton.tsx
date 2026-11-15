import { useState, type ReactNode } from 'react'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, type ButtonProps } from '@trainer/shared/ui'

/** Button that asks for confirmation in a dialog before running a destructive action. */
export function ConfirmButton({
  children,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  ...buttonProps
}: {
  children: ReactNode
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
} & Omit<ButtonProps, 'onClick' | 'title'>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false)
                onConfirm()
              }}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
