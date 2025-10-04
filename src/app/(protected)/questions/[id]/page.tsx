"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoaderOne } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Users,
  Clock,
  PlusCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Question {
  id: number;
  title: string;
  description: string;
  tags: string[];
  participantCount: number;
  allowedEmails: string[];
  owner: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
  ownerUsername: string | null;
}

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

export default function QuestionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  // Carousel states
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
  const [currentProIndex, setCurrentProIndex] = useState(0);
  const [currentConIndex, setCurrentConIndex] = useState(0);

  // Dialog states
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [showProDialog, setShowProDialog] = useState(false);
  const [showConDialog, setShowConDialog] = useState(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState<number | null>(null);
  const [solutionTitle, setSolutionTitle] = useState("");
  const [solutionContent, setSolutionContent] = useState("");
  const [proConContent, setProConContent] = useState("");
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [submittingProCon, setSubmittingProCon] = useState(false);

  const canAddSolution = question?.allowedEmails.includes(session?.user?.email || "") || false;

  const fetchQuestionDetails = useCallback(async () => {
    if (dataFetched) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/questions/${questionId}`);
      if (response.data.success) {
        setQuestion(response.data.data.question);
        setSolutions(response.data.data.solutions || []);
        setDataFetched(true);
      } else {
        setError(response.data.message || "Failed to fetch question details");
      }
    } catch (err: unknown) {
      console.error("Error fetching question details:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to fetch question details");
      toast.error("Failed to load question details");
    } finally {
      setLoading(false);
    }
  }, [questionId, dataFetched]);

  useEffect(() => {
    if (questionId && session && !dataFetched) {
      fetchQuestionDetails();
    }
  }, [questionId, session, fetchQuestionDetails, dataFetched]);

  const handleVote = async (type: "pro" | "con", itemId: number, voteType: 1 | -1) => {
    try {
      // Get current vote to determine if we should toggle
      const currentVote = type === "pro" 
        ? currentPro?.userVote 
        : currentCon?.userVote;
      
      // If clicking the same vote, we'll toggle it off (but API doesn't support removal, so skip)
      if (currentVote === voteType) {
        // For now, just show a message that the vote is already set
        toast("Vote already set! Click the other arrow to change your vote.", {
          icon: "ℹ️",
        });
        return;
      }
      
      const response = await axios.post("/api/vote", {
        type,
        id: itemId,
        vote: voteType,
      });

      if (response.data.success) {
        // Update local state with the new vote - ONLY update the specific type that was voted on
        setSolutions(prevSolutions => 
          prevSolutions.map(solution => ({
            ...solution,
            pros: type === "pro" 
              ? (solution.pros || []).map(pro => 
                  pro.id === itemId 
                    ? { ...pro, userVote: voteType, voteCount: response.data.data?.voteCount || pro.voteCount }
                    : pro
                )
              : solution.pros, // Don't modify pros if voting on con
            cons: type === "con"
              ? (solution.cons || []).map(con => 
                  con.id === itemId 
                    ? { ...con, userVote: voteType, voteCount: response.data.data?.voteCount || con.voteCount }
                    : con
                )
              : solution.cons, // Don't modify cons if voting on pro
          }))
        );
        
        const voteMessage = voteType === 1 ? "👍 Upvoted!" : "👎 Downvoted!";
        toast.success(voteMessage);
        
        // Auto-advance to next pro/con after voting
        setTimeout(() => {
          if (type === "pro") {
            nextPro();
          } else {
            nextCon();
          }
        }, 1200); // Longer delay for better UX
      } else {
        toast.error(response.data.message || "Failed to vote");
      }
    } catch (err: unknown) {
      console.error("Error voting:", err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to vote");
    }
  };

  const handleAddSolution = async () => {
    if (!solutionTitle.trim() || !solutionContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSubmittingSolution(true);
      const response = await axios.post(`/api/questions/${questionId}/solutions`, {
        title: solutionTitle,
        content: solutionContent,
      });

      if (response.data.success) {
        toast.success("Solution added successfully!");
        setSolutionTitle("");
        setSolutionContent("");
        setShowSolutionDialog(false);
        // Add new solution to local state
        setSolutions(prev => [...prev, response.data.data]);
      } else {
        toast.error(response.data.message || "Failed to add solution");
      }
    } catch (err: unknown) {
      console.error("Error adding solution:", err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to add solution");
    } finally {
      setSubmittingSolution(false);
    }
  };

  const handleAddProCon = async (type: "pro" | "con") => {
    if (!proConContent.trim() || !selectedSolutionId) {
      toast.error("Please enter content");
      return;
    }

    try {
      setSubmittingProCon(true);
      const endpoint = type === "pro" 
        ? `/api/solutions/${selectedSolutionId}/pros`
        : `/api/solutions/${selectedSolutionId}/cons`;
      
      const response = await axios.post(endpoint, {
        content: proConContent,
      });

      if (response.data.success) {
        toast.success(`${type === "pro" ? "Pro" : "Con"} added successfully!`);
        setProConContent("");
        setShowProDialog(false);
        setShowConDialog(false);
        setSelectedSolutionId(null);
        
        // Add new pro/con to local state
        setSolutions(prev => 
          prev.map(solution => 
            solution.id === selectedSolutionId
              ? {
                  ...solution,
                  [type === "pro" ? "pros" : "cons"]: [
                    ...(solution[type === "pro" ? "pros" : "cons"] || []),
                    response.data.data
                  ]
                }
              : solution
          )
        );
      } else {
        toast.error(response.data.message || `Failed to add ${type}`);
      }
    } catch (err: unknown) {
      console.error(`Error adding ${type}:`, err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || `Failed to add ${type}`);
    } finally {
      setSubmittingProCon(false);
    }
  };

  const nextSolution = () => {
    if (solutions.length > 0) {
      setCurrentSolutionIndex((prev) => (prev + 1) % solutions.length);
      setCurrentProIndex(0);
      setCurrentConIndex(0);
    }
  };

  const prevSolution = () => {
    if (solutions.length > 0) {
      setCurrentSolutionIndex((prev) => (prev - 1 + solutions.length) % solutions.length);
      setCurrentProIndex(0);
      setCurrentConIndex(0);
    }
  };

  const nextPro = () => {
    const currentSolution = solutions.length > 0 ? solutions[currentSolutionIndex] : null;
    if (currentSolution?.pros && currentSolution.pros.length > 0) {
      setCurrentProIndex((prev) => (prev + 1) % currentSolution.pros.length);
    }
  };

  const prevPro = () => {
    const currentSolution = solutions.length > 0 ? solutions[currentSolutionIndex] : null;
    if (currentSolution?.pros && currentSolution.pros.length > 0) {
      setCurrentProIndex((prev) => (prev - 1 + currentSolution.pros.length) % currentSolution.pros.length);
    }
  };

  const nextCon = () => {
    const currentSolution = solutions.length > 0 ? solutions[currentSolutionIndex] : null;
    if (currentSolution?.cons && currentSolution.cons.length > 0) {
      setCurrentConIndex((prev) => (prev + 1) % currentSolution.cons.length);
    }
  };

  const prevCon = () => {
    const currentSolution = solutions.length > 0 ? solutions[currentSolutionIndex] : null;
    if (currentSolution?.cons && currentSolution.cons.length > 0) {
      setCurrentConIndex((prev) => (prev - 1 + currentSolution.cons.length) % currentSolution.cons.length);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Question not found"}</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Safe access to current items with proper bounds checking
  const currentSolution = solutions.length > 0 && currentSolutionIndex < solutions.length ? solutions[currentSolutionIndex] : null;
  const currentPro = (currentSolution?.pros && currentSolution.pros.length > 0 && currentProIndex < currentSolution.pros.length) 
    ? currentSolution.pros[currentProIndex] : null;
  const currentCon = (currentSolution?.cons && currentSolution.cons.length > 0 && currentConIndex < currentSolution.cons.length) 
    ? currentSolution.cons[currentConIndex] : null;

  return (
    <div className="h-full bg-background">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="hover:bg-muted/80 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          {/* Question Title Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-6 mb-8"
          >
            <h1 className="text-2xl font-bold text-foreground mb-3">{question.title}</h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {question.description}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{question.participantCount} participants</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{solutions.length} solutions</span>
              </div>
            </div>

            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>

          {/* Solutions Carousel */}
          {solutions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No solutions yet</h3>
              <p className="text-muted-foreground text-base">
                {canAddSolution
                  ? "Be the first to add a solution to this question"
                  : "Solutions will appear here when experts add them"}
              </p>
            </motion.div>
          ) : (
            <div className="relative">
              {/* Solution Navigation */}
              {solutions.length > 1 && (
                <div className="flex justify-between items-center mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevSolution}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Solution
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Solution {currentSolutionIndex + 1} of {solutions.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextSolution}
                    className="flex items-center gap-2"
                  >
                    Next Solution
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <AnimatePresence mode="wait">
                {currentSolution && (
                  <motion.div
                    key={currentSolutionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                  >
                    {/* Solution Header */}
                    <div className="p-6 border-b border-border/50">
                      <h2 className="text-xl font-bold text-foreground mb-3">
                        {currentSolution.title}
                      </h2>
                      <p className="text-muted-foreground text-base leading-relaxed mb-4">
                        {currentSolution.content}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        Added on {new Date(currentSolution.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Pros and Cons Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Pros Section */}
                      <div className="p-6 border-r border-border/50">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            
                            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                              Pros
                            </h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSolutionId(currentSolution.id);
                              setShowProDialog(true);
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 w-8 p-0 rounded-full"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Pros Carousel */}
                        {!currentSolution.pros || currentSolution.pros.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No pros yet. Be the first to add one!
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {/* Pro Navigation */}
                            {currentSolution.pros && currentSolution.pros.length > 1 && (
                              <div className="flex justify-between items-center mb-4 p-3 bg-green-50/50 dark:bg-green-950/10 rounded-lg border border-green-200/30 dark:border-green-800/20">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={prevPro}
                                  className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-green-200 dark:border-green-700"
                                >
                                  <ChevronLeft className="h-5 w-5 text-green-600" />
                                </Button>
                                <div className="text-center">
                                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                    {currentProIndex + 1} of {currentSolution.pros.length}
                                  </span>
                                  <p className="text-xs text-green-600/80 dark:text-green-400/80">Pro Arguments</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={nextPro}
                                  className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-green-200 dark:border-green-700"
                                >
                                  <ChevronRight className="h-5 w-5 text-green-600" />
                                </Button>
                              </div>
                            )}

                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`pro-${currentProIndex}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={`relative rounded-xl p-6 transition-all duration-500 backdrop-blur-sm ${
                                  currentPro?.userVote === 1 
                                    ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 border-2 border-green-300 dark:border-green-600 shadow-xl shadow-green-200/30 dark:shadow-green-900/20" 
                                    : currentPro?.userVote === -1
                                    ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-2 border-red-300 dark:border-red-600 shadow-xl shadow-red-200/30 dark:shadow-red-900/20"
                                    : "bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-950/10 dark:to-green-900/20 border border-green-200/60 dark:border-green-800/30 hover:shadow-lg hover:border-green-300/80 dark:hover:border-green-700/50"
                                }`}
                              >
                                {/* Vote status indicator */}
                                
                                
                                <div className="space-y-4">
                                  <p className="text-base text-foreground leading-relaxed font-medium">
                                    {currentPro?.content}
                                  </p>
                                  
                                  <div className="flex items-center justify-between pt-2 border-t border-green-200/50 dark:border-green-800/30">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(currentPro?.createdAt || "").toLocaleDateString()}
                                    </span>
                                    
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVote("pro", currentPro?.id || 0, 1)}
                                        className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                          currentPro?.userVote === 1 
                                            ? "bg-green-500 hover:bg-green-600 text-white shadow-lg scale-110 ring-2 ring-green-300" 
                                            : "hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 hover:scale-105"
                                        }`}
                                      >
                                        <ArrowUp className={`h-4 w-4 transition-transform duration-200 ${
                                          currentPro?.userVote === 1 ? "" : "group-hover:scale-110"
                                        }`} />
                                      </Button>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVote("pro", currentPro?.id || 0, -1)}
                                        className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                          currentPro?.userVote === -1 
                                            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg scale-110 ring-2 ring-red-300" 
                                            : "hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 hover:scale-105"
                                        }`}
                                      >
                                        <ArrowDown className={`h-4 w-4 transition-transform duration-200 ${
                                          currentPro?.userVote === -1 ? "" : "group-hover:scale-110"
                                        }`} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        )}
                      </div>

                      {/* Cons Section */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            
                            <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                              Cons
                            </h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSolutionId(currentSolution.id);
                              setShowConDialog(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0 rounded-full"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Cons Carousel */}
                        {!currentSolution.cons || currentSolution.cons.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic text-center py-8">
                            No cons yet. Be the first to add one!
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {/* Con Navigation */}
                            {currentSolution.cons && currentSolution.cons.length > 1 && (
                              <div className="flex justify-between items-center mb-4 p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-200/30 dark:border-red-800/20">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={prevCon}
                                  className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-red-200 dark:border-red-700"
                                >
                                  <ChevronLeft className="h-5 w-5 text-red-600" />
                                </Button>
                                <div className="text-center">
                                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                    {currentConIndex + 1} of {currentSolution.cons.length}
                                  </span>
                                  <p className="text-xs text-red-600/80 dark:text-red-400/80">Con Arguments</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={nextCon}
                                  className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-red-200 dark:border-red-700"
                                >
                                  <ChevronRight className="h-5 w-5 text-red-600" />
                                </Button>
                              </div>
                            )}

                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`con-${currentConIndex}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={`relative rounded-xl p-6 transition-all duration-500 backdrop-blur-sm ${
                                  currentCon?.userVote === 1 
                                    ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 border-2 border-green-300 dark:border-green-600 shadow-xl shadow-green-200/30 dark:shadow-green-900/20" 
                                    : currentCon?.userVote === -1
                                    ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-2 border-red-300 dark:border-red-600 shadow-xl shadow-red-200/30 dark:shadow-red-900/20"
                                    : "bg-gradient-to-r from-red-50/50 to-red-100/50 dark:from-red-950/10 dark:to-red-900/20 border border-red-200/60 dark:border-red-800/30 hover:shadow-lg hover:border-red-300/80 dark:hover:border-red-700/50"
                                }`}
                              >
                                
                                
                                <div className="space-y-4">
                                  <p className="text-base text-foreground leading-relaxed font-medium">
                                    {currentCon?.content}
                                  </p>
                                  
                                  <div className="flex items-center justify-between pt-2 border-t border-red-200/50 dark:border-red-800/30">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(currentCon?.createdAt || "").toLocaleDateString()}
                                    </span>
                                    
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVote("con", currentCon?.id || 0, 1)}
                                        className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                          currentCon?.userVote === 1 
                                            ? "bg-green-500 hover:bg-green-600 text-white shadow-lg scale-110 ring-2 ring-green-300" 
                                            : "hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 hover:scale-105"
                                        }`}
                                      >
                                        <ArrowUp className={`h-4 w-4 transition-transform duration-200 ${
                                          currentCon?.userVote === 1 ? "" : "group-hover:scale-110"
                                        }`} />
                                      </Button>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleVote("con", currentCon?.id || 0, -1)}
                                        className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                          currentCon?.userVote === -1 
                                            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg scale-110 ring-2 ring-red-300" 
                                            : "hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 hover:scale-105"
                                        }`}
                                      >
                                        <ArrowDown className={`h-4 w-4 transition-transform duration-200 ${
                                          currentCon?.userVote === -1 ? "" : "group-hover:scale-110"
                                        }`} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Solution Button */}
      {canAddSolution && (
        <div className="fixed bottom-8 right-8">
          <Button
            onClick={() => setShowSolutionDialog(true)}
            size="lg"
            className="rounded-full h-16 w-16 shadow-xl hover:shadow-2xl transition-all duration-300 bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="h-8 w-8" />
          </Button>
        </div>
      )}

      {/* Add Solution Dialog */}
      <Dialog open={showSolutionDialog} onOpenChange={setShowSolutionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Solution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Solution Title
              </label>
              <Input
                value={solutionTitle}
                onChange={(e) => setSolutionTitle(e.target.value)}
                placeholder="Enter solution title"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Solution Description
              </label>
              <Textarea
                value={solutionContent}
                onChange={(e) => setSolutionContent(e.target.value)}
                placeholder="Describe your solution in detail"
                className="w-full min-h-[120px]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSolutionDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSolution}
                disabled={submittingSolution}
                className="flex-1"
              >
                {submittingSolution ? "Adding..." : "Add Solution"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pro Dialog */}
      <Dialog open={showProDialog} onOpenChange={setShowProDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Pro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Pro Description
              </label>
              <Textarea
                value={proConContent}
                onChange={(e) => setProConContent(e.target.value)}
                placeholder="Describe the positive aspect of this solution"
                className="w-full min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowProDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAddProCon("pro")}
                disabled={submittingProCon}
                className="flex-1"
              >
                {submittingProCon ? "Adding..." : "Add Pro"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Con Dialog */}
      <Dialog open={showConDialog} onOpenChange={setShowConDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Con</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Con Description
              </label>
              <Textarea
                value={proConContent}
                onChange={(e) => setProConContent(e.target.value)}
                placeholder="Describe the negative aspect of this solution"
                className="w-full min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAddProCon("con")}
                disabled={submittingProCon}
                className="flex-1"
              >
                {submittingProCon ? "Adding..." : "Add Con"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}