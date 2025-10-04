"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowUp, ArrowDown, Plus } from "lucide-react";

interface User {
  uid: number;
  username: string | null;
  email: string;
}

interface ProCon {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  voteCount: number;
  userVote: number | null;
}

interface Solution {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  pros: ProCon[];
  cons: ProCon[];
  voteCount: number;
  userVote: number | null;
}

interface SolutionCardProps {
  solution: Solution;
  canAddSolution: boolean;
  onAddPro: (solutionId: number) => void;
  onAddCon: (solutionId: number) => void;
  onVote: (type: "pro" | "con", itemId: number, voteType: 1 | -1) => void;
}

const SolutionCard = ({ 
  solution, 
  canAddSolution, 
  onAddPro, 
  onAddCon, 
  onVote 
}: SolutionCardProps) => {
  const currentPro = solution.pros?.[0];
  const currentCon = solution.cons?.[0];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {solution.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {solution.user.username || solution.user.email}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {new Date(solution.createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground leading-relaxed">
            {solution.content}
          </p>
        </div>

        {/* Pros and Cons Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pros Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                Pros ({solution.pros?.length || 0})
              </h4>
              {canAddSolution && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddPro(solution.id)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Pro
                </Button>
              )}
            </div>
            
            {currentPro ? (
              <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {currentPro.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      by {currentPro.user.username || currentPro.user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVote("pro", currentPro.id, 1)}
                        className={`h-8 w-8 p-0 ${
                          currentPro.userVote === 1 
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                            : "hover:bg-green-50 hover:text-green-600"
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {currentPro.voteCount || 0}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVote("pro", currentPro.id, -1)}
                        className={`h-8 w-8 p-0 ${
                          currentPro.userVote === -1 
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" 
                            : "hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pros yet
              </div>
            )}
          </div>

          {/* Cons Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                Cons ({solution.cons?.length || 0})
              </h4>
              {canAddSolution && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddCon(solution.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Con
                </Button>
              )}
            </div>
            
            {currentCon ? (
              <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {currentCon.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      by {currentCon.user.username || currentCon.user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVote("con", currentCon.id, 1)}
                        className={`h-8 w-8 p-0 ${
                          currentCon.userVote === 1 
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                            : "hover:bg-green-50 hover:text-green-600"
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {currentCon.voteCount || 0}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVote("con", currentCon.id, -1)}
                        className={`h-8 w-8 p-0 ${
                          currentCon.userVote === -1 
                            ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" 
                            : "hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No cons yet
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SolutionCard;