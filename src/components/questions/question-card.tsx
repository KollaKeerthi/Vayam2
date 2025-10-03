"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Globe, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

interface Question {
  id: number
  title: string
  description: string
  tags: string[]
  participantCount: number
  allowedEmails: string[]
  owner: number
  isActive: boolean
  isPublic: boolean
  createdAt: string
  updatedAt: string
  ownerEmail: string
  ownerUsername: string | null
}

interface QuestionCardProps {
  question: Question
  index: number
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className="group h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-border/50 hover:border-primary/30 bg-card hover:bg-card/90"
        onClick={() => router.push(`/questions/${question.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors flex-1">
              {question.title}
            </CardTitle>
            <div className="flex items-center gap-1">
              {question.isPublic ? (
                <div title="Public question">
                  <Globe className="h-4 w-4 text-green-500" />
                </div>
              ) : (
                <div title="Private question">
                  <Lock className="h-4 w-4 text-orange-500" />
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
            {question.description}
          </p>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {question.participantCount} participants
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.tags.slice(0, 3).map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                >
                  {tag}
                </Badge>
              ))}
              {question.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal"
                >
                  +{question.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* SME Info for Private Questions */}
          {!question.isPublic && question.allowedEmails.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
              <span className="font-medium">SME Access:</span> {question.allowedEmails.length} expert{question.allowedEmails.length !== 1 ? 's' : ''} invited
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
              Join discussion
            </span>
            <div className="flex items-center gap-2">
              {!question.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                by {question.ownerUsername || question.ownerEmail}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}