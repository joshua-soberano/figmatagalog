import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import defaultVocabWords from "../assets/utils/all_lessons_vocab.json";
import { useVocab } from "./vocabStorage";
import { resetSentenceItems } from "./sentenceStorage";
import { AppState } from "react-native"; // ✅ Added

const VOCAB_KEY = "tagalogApp.vocab.v1";
const STORAGE_KEY = "tagalogApp.profile.v1";

export type QuizRecord = {
  date: string;
  topic: "vocab" | "sentences" | "verbs" | "grammar";
  correct: number;
  total: number;
};

export type WrongAnswerRecord = {
  id: string;               // unique question ID
  topic: QuizRecord["topic"]
  prompt: string;           // the question text
  correctAnswer: string;    // the “right” answer
  userAnswer: string;       // what they picked or entered
  timestamp: string;        // ISO date string
  mode: "fill" | "multiple";
};

export type Profile = {
  username?: string;
  streak: number;
  lastStreakDate: string;      // tracks the last date streak was incremented
  quizzes: QuizRecord[];
  completedLessons: { [lessonId: number]: boolean }
  questionStats: {
    totalAnswered: number;
    totalCorrect: number;
    byTopic: {
      [topic in QuizRecord["topic"]]?: { correct: number; total: number };
    };
  };
  createdAt: string; 
  dailyChallengesCompleted?: Record<string, string>;
  dailyQuestsCompleted: Record<"all" | "lesson" | "masterTen", string>;
  lastActiveDate: string;
  wrongAnswers: WrongAnswerRecord[];
  dailyQuestionStats: {
  [date: string]: {
    totalAnswered: number;
    totalCorrect: number;
  };

};
  recentUnits: number[];

};

const makeDefaultProfile = (): Profile => ({
  streak: 1,
  lastStreakDate: new Date().toDateString(),
  quizzes: [],
  completedLessons: {},
  questionStats: {
    totalAnswered: 0,
    totalCorrect: 0,
    byTopic: {},
  },
  createdAt: new Date().toISOString(),
  dailyChallengesCompleted: {},
  dailyQuestsCompleted: {
    all: "",
    lesson: "",
    masterTen: ""
  },
  lastActiveDate: new Date().toISOString().split("T")[0],
  wrongAnswers: [],
  dailyQuestionStats: {},
  recentUnits: [],


});

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  recordQuestionResult: (topic: QuizRecord["topic"], wasCorrect: boolean) => void;
  recordQuiz: (topic: QuizRecord["topic"], correct: number, total: number) => void;
  resetProfile: () => void;
  toggleLessonCompleted: (lessonId: number) => void;
  recordDailyQuest: (questKey: "all" | "lesson" | "learnTen" | "masterTen") => void;
  recordWrongAnswer: (
    record: Omit<WrongAnswerRecord, "id" | "timestamp">
    ) => void;
  removeWrongAnswer:  (id: string) => void;
  correctPreviousMistake: (topic: QuizRecord["topic"]) => void;
  recordUnitCompleted: (unit: number) => void;
};


const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const saveProfile = async (updated: Profile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save profile", err);
    }
  };



  const { reset: resetVocab } = useVocab(); // use the vocab reset

  const resetProfile = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      const defaultProfile = makeDefaultProfile();
      setProfile(defaultProfile);
      await saveProfile(defaultProfile);
      await resetVocab(); // 👈 also reset vocab storage
      await resetSentenceItems();
    } catch (err) {
      console.warn("Failed to reset profile", err);
    }
  }, [resetVocab]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadProfile();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile !== null) {
      saveProfile(profile);
    }
  }, [profile]);


  const loadProfile = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsedRaw = raw ? JSON.parse(raw) : {};
    
    // Step 1: Merge stored data into a full profile
  // Step 1: Merge stored data into a full profile
const parsed: Profile = {
  ...makeDefaultProfile(),
  ...parsedRaw,
  completedLessons: parsedRaw.completedLessons ?? {},
  dailyChallengesCompleted: parsedRaw.dailyChallengesCompleted ?? {},
  dailyQuestsCompleted: parsedRaw.dailyQuestsCompleted ?? { all: "", lesson: "", masterTen: "" },
  lastActiveDate: parsedRaw.lastActiveDate,
  wrongAnswers: (parsedRaw.wrongAnswers ?? []).map((w: any) => ({
    ...w,
    mode: w.mode === "fill" ? "fill" : "multiple",
  })) as WrongAnswerRecord[],
};

// Step 2: Check for new day and reset
const todayStr = new Date().toISOString().split("T")[0];
if (parsed.lastActiveDate !== todayStr) {
  // console.log("🕛 Resetting daily progress for new day.");

  parsed.dailyChallengesCompleted = {};
  parsed.dailyQuestsCompleted = { all: "", lesson: "", masterTen: "" };

  // Keep only today's stats if they already exist
  const todaysStats = parsed.dailyQuestionStats?.[todayStr] ?? {
    totalAnswered: 0,
    totalCorrect: 0,
  };
  parsed.dailyQuestionStats = {
    [todayStr]: todaysStats,
  };

  parsed.wrongAnswers = [];
  parsed.lastActiveDate = todayStr;
}


    // Step 3: Handle streak update
    const today = new Date().toDateString();
    const lastDate = new Date(parsed.lastStreakDate);
    const diffInDays = (new Date(today).getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
    if (diffInDays === 1) {
      parsed.streak += 1;
    } else if (diffInDays > 1) {
      parsed.streak = 1;
    }
    parsed.lastStreakDate = today;

    // Step 4: Save + store profile
    setProfile(parsed);
    setLoading(false);
    if (raw) await saveProfile(parsed);
  } catch (err) {
    console.warn("Failed to load profile", err);
    const fallback = makeDefaultProfile();
    setProfile(fallback);
    setLoading(false);
    await saveProfile(fallback);
  }
};



  useEffect(() => {
    loadProfile();
  }, []);

// ← NEW: whenever profile changes, persist it
    useEffect(() => {
      if (profile !== null) {
        saveProfile(profile);
      }
    }, [profile]);  

  const recordQuestionResult = useCallback(
  (topic: QuizRecord["topic"], wasCorrect: boolean) => {
    setProfile((prev) => {
      if (!prev) return prev;

      const todayStr = new Date().toISOString().split("T")[0];
      const prevDaily = prev.dailyQuestionStats[todayStr] ?? {
        totalAnswered: 0,
        totalCorrect: 0,
      };

      const updatedDaily = {
        totalAnswered: prevDaily.totalAnswered + 1,
        totalCorrect: prevDaily.totalCorrect + (wasCorrect ? 1 : 0),
      };

      const updated: Profile = {
        ...prev,
        questionStats: {
          totalAnswered: prev.questionStats.totalAnswered + 1,
          totalCorrect: prev.questionStats.totalCorrect + (wasCorrect ? 1 : 0),
          byTopic: {
            ...prev.questionStats.byTopic,
            [topic]: {
              correct:
                (prev.questionStats.byTopic[topic]?.correct ?? 0) +
                (wasCorrect ? 1 : 0),
              total:
                (prev.questionStats.byTopic[topic]?.total ?? 0) + 1,
            },
          },
        },
        dailyQuestionStats: {
          ...prev.dailyQuestionStats,
          [todayStr]: updatedDaily,
        },
      };

      setTimeout(() => saveProfile(updated), 0);
      return updated;
    });
  },
  []
);


  const recordQuiz = useCallback(
    (topic: QuizRecord["topic"], correct: number, total: number) => {
      setProfile((prev) => {
        if (!prev) return prev;

        // 1) compute “today” in YYYY-MM-DD form
        const todayStr = new Date().toISOString().split("T")[0];

        // 2) build your new QuizRecord
        const newQuiz: QuizRecord = {
          date: new Date().toISOString(),
          topic,
          correct,
          total,
        };

        // 3) merge in the stamp for dailyChallengesCompleted and lastActiveDate
        const updated: Profile = {
          ...prev,
          quizzes: [newQuiz, ...prev.quizzes.slice(0, 49)],
          dailyChallengesCompleted: {
            // carry over anything done earlier today, then mark this topic
            ...(prev.dailyChallengesCompleted ?? {}),
            [topic]: todayStr,           // ← ← ← **HERE** 
          },
          lastActiveDate: todayStr,      // ← ← ← **AND HERE**
        };

        // 4) save it
        setTimeout(() => saveProfile(updated), 0);
        return updated;
      });
    },
    [saveProfile]
  );


const recordDailyQuest = useCallback(
  (questKey: "all" | "lesson" | "learnTen" | "masterTen") => {
    setProfile(prev => {
      if (!prev) return prev;
      const todayStr = new Date().toISOString().split("T")[0];
      const updated: Profile = {
        ...prev,
        dailyQuestsCompleted: {
          ...prev.dailyQuestsCompleted,
          [questKey]: todayStr
        }
      };
      setTimeout(() => saveProfile(updated), 0);
      return updated;
    });
  },
  [saveProfile]
);

const recordUnitCompleted = useCallback((unit: number) => {
  setProfile(prev => {
    if (!prev) return prev;
    const updated = {
      ...prev,
      recentUnits: [unit, ...prev.recentUnits.filter(u => u !== unit)].slice(0, 5)
    };
    setTimeout(() => saveProfile(updated), 0);
    return updated;
  });
}, []);

 const recordWrongAnswer = useCallback((record: Omit<WrongAnswerRecord, "id" | "timestamp">) => {
  const newRecord: WrongAnswerRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...record
  };

  setProfile(prev => {
    if (!prev) return prev;
    const updated = {
      ...prev,
      wrongAnswers: [...prev.wrongAnswers, newRecord],
    };
    setTimeout(() => saveProfile(updated), 0);
    return updated;
  });
}, [saveProfile]);


 const removeWrongAnswer = useCallback((id: string) => {
  // console.log(id)
  setProfile(prev => {
    if (!prev) return prev;
    const updated = {
      ...prev,
      wrongAnswers: prev.wrongAnswers.filter(w => w.id !== id),
    };
    setTimeout(() => saveProfile(updated), 0);
    return updated;
  });
}, [saveProfile]);

const correctPreviousMistake = useCallback((topic: QuizRecord["topic"]) => {
  setProfile((prev) => {
    if (!prev) return prev;

    const todayStr = new Date().toISOString().split("T")[0];
    const prevDaily = prev.dailyQuestionStats[todayStr] ?? {
      totalAnswered: 0,
      totalCorrect: 0,
    };

    const topicStats = prev.questionStats.byTopic[topic] ?? { correct: 0, total: 0 };

    const updatedProfile: Profile = {
      ...prev,
      questionStats: {
        ...prev.questionStats,
        totalCorrect: prev.questionStats.totalCorrect + 1,
        byTopic: {
          ...prev.questionStats.byTopic,
          [topic]: {
            total: topicStats.total,
            correct: topicStats.correct + 1,
          }
        }
      },
      dailyQuestionStats: {
        ...prev.dailyQuestionStats,
        [todayStr]: {
          totalAnswered: prevDaily.totalAnswered,
          totalCorrect: prevDaily.totalCorrect + 1,
        }
      }
    };

    setTimeout(() => saveProfile(updatedProfile), 0);
    return updatedProfile;
  });
}, []);




const toggleLessonCompleted = useCallback((lessonId: number) => {
  setProfile((prev) => {
    if (!prev) return prev;

    const isCompleted = prev.completedLessons[lessonId] ?? false;

    const updated: Profile = {
      ...prev,
      completedLessons: {
        ...prev.completedLessons,
        [lessonId]: !isCompleted,  // toggle
      },
    };

    setTimeout(() => saveProfile(updated), 0);
    return updated;
  });
}, [saveProfile]);



  return (
    <ProfileContext.Provider
      value={{ profile, loading, recordQuestionResult, recordQuiz, recordDailyQuest, resetProfile, toggleLessonCompleted, correctPreviousMistake, recordWrongAnswer, removeWrongAnswer,recordUnitCompleted }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
