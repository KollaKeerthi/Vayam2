"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface AddProConDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string) => Promise<void>;
  submitting: boolean;
  type: "pro" | "con";
  content: string;
  onContentChange: (content: string) => void;
}

const AddProConDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  submitting, 
  type,
  content,
  onContentChange
}: AddProConDialogProps) => {
  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit(content);
  };

  const title = type === "pro" ? "Add Pro" : "Add Con";
  const placeholder = type === "pro" 
    ? "Describe the positive aspect of this solution"
    : "Describe the negative aspect of this solution";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {title} Description
            </label>
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[100px]"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="flex-1"
            >
              {submitting ? "Adding..." : title}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProConDialog;