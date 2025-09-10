import * as React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Keyboard, Image, Text, TextInput, TouchableOpacity } from "react-native";
import { generateQuestions} from "./questionUtils";
import { useProfile } from "./ProfileContext";
import { updateWordAfterAnswer } from "@/assets/utils/updateVocab";
import { loadVocabWords, useVocab, updateSingleWord } from "./vocabStorage";
import { cosineSimilarity, meanPool } from "@/assets/utils/similarity";
import { loadOnnxModel } from "@/assets/utils/loadmodel";
import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { getTokenizedInput } from "@/assets/utils/gettokens";
import { useSentences } from "@/app/sentenceStorage";
import { updateSentenceAfterAnswer } from "@/assets/utils/updatesentences";
import { generateSentenceQuestions } from "./sentenceQuestionUtils";
import { distance as levenshtein } from "fastest-levenshtein";


// import the vocabwords json



type Question = {
  wordtotranslate: string;
  options: string[];
  translation: string | string[]; // ✅ now allows array
  acceptedAnswers?: string[];
  mode: "multiple" | "fill";
  targetLang: "English" | "Tagalog" | "AspectFocus" | "Word" | "TransFocus" | "Pronoun" | "Translation";
};



export const MAX_LENGTH = 128;

function normalizeEnglish(sentence: string): string {
  return sentence
    .replace(/[’‘‛`´]/g, "'")
    .toLowerCase()                         // Normalize case first
    .replace(/[.?!]/g, "")                 // Remove terminal punctuation
    .replace(/\b(she)\b/g, "he")        // Gender normalization
    .replace(/\bher\b/g, "him")
    .replace(/\bhers\b/g, "his")
    .replace(/[‐‑‒–—―]/g, "-")

    

    // Contraction expansions
    .replace(/\bi'm\b/g, "i am")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bdon't\b/g, "do not")
    .replace(/\bdoesn't\b/g, "does not")
    .replace(/\bdidn't\b/g, "did not")
    .replace(/\bhaven't\b/g, "have not")
    .replace(/\bhadn't\b/g, "had not")
    .replace(/\bit's\b/g, "it is")
    .replace(/\bthat's\b/g, "that is")
    .replace(/\bthere's\b/g, "there is")
    .replace(/\bthey're\b/g, "they are")
    .replace(/\bwe're\b/g, "we are")
    .replace(/\byou're\b/g, "you are")
    .replace(/\bwasn't\b/g, "was not")
    .replace(/\bweren't\b/g, "were not")
    .replace(/\bwouldn't\b/g, "would not")
    .replace(/\bcouldn't\b/g, "could not")
    .replace(/\bshouldn't\b/g, "should not")
    .replace(/\bain't\b/g, "is not")
    .replace(/\bi've\b/g, "i have")
    .replace(/\bi'd\b/g, "i would")
    .replace(/\bi'll\b/g, "i will")
    .replace(/\byou've\b/g, "you have")
    .replace(/\byou'd\b/g, "you would")
    .replace(/\byou'll\b/g, "you will")
    .replace(/\bthey've\b/g, "they have")
    .replace(/\bthey'd\b/g, "they would")
    .replace(/\bthey'll\b/g, "they will")
    .replace(/\blet's\b/g, "let us")

    .replace(/\s+/g, " ")                  // Collapse whitespace
    .trim();                               // Remove leading/trailing spaces
}



export default function QuizScreen() {
  const router = useRouter();
  const { mode, topic } = useLocalSearchParams();
  const {recordQuestionResult, recordQuiz, recordWrongAnswer, profile} = useProfile();
  const {sentences, updateSentence} = useSentences()
  const allowedTopics = ["vocab", "sentences", "verbs", "grammar"] as const;
  type AllowedTopic = (typeof allowedTopics)[number];
  const {vocab} = useVocab();
  const [session, setSession] = React.useState<InferenceSession | null>(null);

  const topicParamRaw = Array.isArray(topic) ? topic[0] : topic;
  const safeTopic: AllowedTopic = allowedTopics.includes(topicParamRaw as AllowedTopic)
    ? (topicParamRaw as AllowedTopic)
    : "vocab";




  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [userInput, setUserInput] = React.useState("");
  const [shuffledOptions, setShuffledOptions] = React.useState<string[]>([]);
  const [showCorrectModal, setShowCorrectModal] = React.useState(false);
  const [showResultModal, setShowResultModal] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState(false);
  
  
  // Then your effects
React.useEffect(() => {
  const loadQuestions = async () => {
    if (questions.length > 0) return; // ✅ Prevent regenerating if already set

    if (safeTopic === "sentences") {
      if (profile && sentences.length > 0) {
        const snapshot = [...sentences];  // freeze the state at quiz start
        const generated = generateSentenceQuestions(10, profile, snapshot);
        setQuestions(generated);
      } else {
        console.warn("Profile or sentence list missing — skipping generation.");
      }
    } else {
      const generated = await generateQuestions(safeTopic, 10);
      setQuestions(generated);
    }
  };

  loadQuestions();
}, [safeTopic, profile, sentences]);






  React.useEffect(() => {
    if (questions[questionIndex]) {
      setShuffledOptions(shuffleArray(questions[questionIndex].options));
    }
    else {
      setShuffledOptions([]);
    }
  }, [questionIndex, questions]);

React.useEffect(() => {
  (async () => {
    const sess = await loadOnnxModel();
    // console.log("Model inputs:", sess.inputNames);

    const [ idName, maskName ] = sess.inputNames;

    // BERT‐style models want int64. Use BigInt64Array + "int64"
    const zeros = new BigInt64Array(MAX_LENGTH).fill(0n);
    const dummyIds  = new Tensor("int64", zeros, [1, MAX_LENGTH]);
    const dummyMask = new Tensor("int64", zeros, [1, MAX_LENGTH]);

    try {
      await sess.run({
        [idName]: dummyIds,
        [maskName]: dummyMask,
      });
      // console.log("✅ ONNX warmed up!");
      // console.log("Outputs:", sess.outputNames);
    } catch (err) {
      console.error("❌ Warm-up failed:", err);
    }
  })();
}, []);





  const topicColors: Record<string,string> = {
  vocab: "#DCB0FE",       // Purple
  verbs: "orange",        // Orange
  sentences: "olive",     // Olive
  grammar: "pink",        // Pink
  };

  const themeColor = topicColors[safeTopic] || "#DCB0FE";

  const topicTitles: Record<string, string> = {
    vocab: "Vocabulary Practice",
    verbs: "Verb Conjugations",
    sentences: "Sentence Practice",
    grammar: "Grammar Practice",
  };

  if (questions.length === 0) {
    return <Text>Loading questions...</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#E9D9B7" }}>

      <View style={styles.headerRow}>
  <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
    <Text style={styles.backButtonText}>←</Text>
  </TouchableOpacity>
  <Image
    source={{
      uri: "https://cdn.builder.io/api/v1/image/assets/TEMP/af5676338e10bd7e496a262d91053bcc5b39e124?placeholderIfAbsent=true&apiKey=1d7b2223161b43eca772885930310230",
    }}
    style={styles.profileIcon}
  />
  </View>


        <ScrollView style={[styles.container, {alignItems: undefined}]} contentContainerStyle = {{ alignItems: "center" }}>

      <View style={[styles.titleSection, { backgroundColor: themeColor }]}>
        <Image
          source={{
            uri: "https://cdn.builder.io/api/v1/image/assets/TEMP/da75a8aea0ee0f95acce77ed32718d3080375406?placeholderIfAbsent=true&apiKey=1d7b2223161b43eca772885930310230",
          }}
          style={styles.titleIcon}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{topicTitles[safeTopic] || "Vocabulary Practice"}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>15'</Text>
        </View>
      </View>

      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>Question {questionIndex+1} / {questions.length} </Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score:</Text>
            <Text style={styles.scoreText}>{score}/{attempts}</Text>
          </View>
        </View>
 
        <View style={styles.questionContent}>
          <Text style={styles.instructionText}>
  {(() => {
    const q = questions[questionIndex];
    const matchedWord = vocab.find(w => {
  if (w.tagalog === q.wordtotranslate) return true;
  if (Array.isArray(w.english)) {
    return w.english.includes(q.wordtotranslate);
  }
  return w.english === q.wordtotranslate;
});

    // console.log(q.targetLang)

    const showPartOfSpeech = matchedWord?.otherId && matchedWord.otherId.length > 0;
    const pos = matchedWord?.partOfSpeech?.toLowerCase();
    const unit = matchedWord?.unit;
    const extraLabel = showPartOfSpeech && pos && unit !== undefined
      ? ` (${pos}, Unit ${unit})`
      : "";


    if (q.targetLang === "English") {
      return showPartOfSpeech
        ? `Translate to English (${extraLabel}):`
        : `Translate to English:`;
    }

    if (q.targetLang === "Tagalog") {
      return showPartOfSpeech
        ? `Translate to Tagalog (${extraLabel}):`
        : `Translate to Tagalog:`;
    }

    if (q.targetLang === "Pronoun") {
      return q.mode === "multiple"
        ? "Match the Tagalog Pronoun:"
        : "Type the Tagalog Pronoun:";
    }

    // Add other conditions unchanged...
    if (q.targetLang === "AspectFocus") return "Match the Aspect & Focus:";
    if (q.targetLang === "Word") return "Match the Word:";
    if (q.targetLang === "TransFocus") {
      return q.mode === "fill"
        ? "Translate to English:"
        : "Match the Translation + Focus:";
    }

    if (q.targetLang === "Translation") {
      return q.mode === "multiple"
        ? "Match the Translation:"
        : "Translate:";
    }

    return "Answer the question:";
  })()}
</Text>



          <Text style={styles.WordToTranslate}>{questions[questionIndex].wordtotranslate}</Text>
        </View>
      </View>

      {questions[questionIndex].mode === "multiple" && (
        <>
          {shuffledOptions.map((option, idx) => (
        <TouchableOpacity
        key={idx}
        style={[styles.optionButton, { backgroundColor: themeColor }]}
        onPress={async () => {
          const q = questions[questionIndex];
          const normalized = (s: string) => s.trim().toLowerCase();
          const translations: string[] = Array.isArray(q.translation)
            ? q.translation
            : [q.translation];
          
          // console.log("translations:")
          // console.log(translations)

          // console.log("accepted Answers:")
          // console.log(q.acceptedAnswers)

          const correct = q.acceptedAnswers
            ? q.acceptedAnswers.map(normalized).includes(normalized(option))
            : Array.isArray(q.translation)
              ? q.translation.map(normalized).includes(normalized(option))
              : normalized(option) === normalized(q.translation);

          
          // console.log("correct")
          // console.log(correct)

          recordQuestionResult(safeTopic, correct)
           if (!correct) {
            recordWrongAnswer({
              topic: safeTopic,
              prompt: q.wordtotranslate,
              correctAnswer: Array.isArray(q.translation) ? q.translation[0] : q.translation,
              userAnswer: option,
              mode: q.mode,
            });
          }
          setIsCorrect(correct);
          setShowCorrectModal(true);
          setAttempts(prev => prev + 1);
          if (correct) {
            setScore(prev => prev + 1)
          }

          if (safeTopic === "sentences") {
            const match = sentences.find(
              s =>
                s.english === q.translation ||
                s.tagalog === q.wordtotranslate
            );
            if (match) {
              const today = new Date().toISOString().split("T")[0];
              const updated = updateSentenceAfterAnswer(match, correct, "multiple");
              await updateSentence(updated);
              // console.log("✅ Updated sentence weight:", updated.weight, "for", updated.tagalog);
              // console.log("RUs: ", profile?.recentUnits)
            }
          }

          if (safeTopic === "vocab") {
            const allWords = await loadVocabWords();
            const matched = allWords.find(
              w =>
                w.tagalog === questions[questionIndex].wordtotranslate ||
                Array.isArray(w.english)
                  ? w.english.includes(questions[questionIndex].wordtotranslate)
                  : Array.isArray(w.english)
                    ? (w.english as string[]).includes(q.wordtotranslate)
                    : w.english === q.wordtotranslate



            );
            if (matched) {
              const today = new Date().toISOString().split("T")[0];
              const updated = updateWordAfterAnswer(matched, correct, "vocab", "multiple", today);
              await updateSingleWord(updated);
              // console.log("Updated weight:", updated.weight, "for", updated.tagalog);

            }
          }


          }}

      >
        <Text style={styles.optionText}>{option}</Text>
      </TouchableOpacity>
          ))}
        </>
      )}

      {questions[questionIndex].mode === "fill" &&(
        <View style = {{width: "100%", alignItems: "center"}}>
        <View style={[styles.fillBox, { backgroundColor: themeColor }]}>
          <TextInput
            value = {userInput}
            onChangeText={setUserInput}
            placeholder="Type your answer here"
            placeholderTextColor="black"
            multiline
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
            style={styles.fillInput}
            returnKeyType="done"
            autoCorrect = {false}
          />
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={async () => {
  const q = questions[questionIndex];

  let correct = false;

  if (safeTopic === "sentences") {
    // ── Only for sentence practice: do ONNX inference + cosine check ──
    const session = await loadOnnxModel();
    const [idName, maskName] = session.inputNames;
    const outName = session.outputNames[0];


    const rawInput = normalizeEnglish(userInput);
    const rawTarget = normalizeEnglish(
        Array.isArray(q.translation) ? q.translation[0] : q.translation
      );

    // console.log(normalizeEnglish("you're"))
    // console.log(userInput)
    // console.log(q.translation)
    // console.log(rawInput)
    // console.log(normalizeEnglish(rawInput))
    // console.log(rawTarget)


    // Tokenize → convert to 64-bit tensors
    const rawUser    = await getTokenizedInput(rawInput);
    const rawCorrect = await getTokenizedInput(rawTarget);

    const levenshteinDistance = levenshtein(rawInput, rawTarget);
    const maxDistance = Math.max(1, Math.floor(rawTarget.length * 0.1));


    


    const toInt64 = (raw: Tensor) => {
      const big = new BigInt64Array(raw.data.length).fill(0n);
      for (let i = 0; i < raw.data.length; i++) {
        big[i] = BigInt((raw.data as any)[i]);
      }
      return new Tensor("int64", big, raw.dims);
    };
    const userTensor    = toInt64(rawUser);
    const correctTensor = toInt64(rawCorrect);

    // build int64 mask
    const maskData = new BigInt64Array(MAX_LENGTH).fill(1n);
    const attentionMask = new Tensor("int64", maskData, [1, MAX_LENGTH]);

    try {
      const uOut = await session.run({ [idName]: userTensor,    [maskName]: attentionMask });
      const cOut = await session.run({ [idName]: correctTensor, [maskName]: attentionMask });
      const uHS = (uOut[outName].data as Float32Array);
      const cHS = (cOut[outName].data as Float32Array);

      // masked mean‐pool
      const maskArr = Array.from(maskData, x => Number(x));
      const hiddenDim = uHS.length / MAX_LENGTH;
      const meanPool = (hs: Float32Array) => {
        const sum = new Array(hiddenDim).fill(0);
        let cnt = 0;
        for (let t = 0; t < MAX_LENGTH; t++) {
          if (maskArr[t] === 1) {
            cnt++;
            for (let d = 0; d < hiddenDim; d++) {
              sum[d] += hs[t*hiddenDim + d];
            }
          }
        }
        return sum.map(v => v / cnt);
      };

      const userEmbedding    = meanPool(uHS);
      const correctEmbedding = meanPool(cHS);

      const similarity = cosineSimilarity(userEmbedding, correctEmbedding);
      // console.log("sentence similarity:", similarity);
      correct = similarity > 0.992 || levenshteinDistance <= maxDistance; // your calibrated threshold

      const match = sentences.find(
      s =>
        s.english === q.translation ||
        s.tagalog === q.wordtotranslate
    );
    if (match) {
      const today = new Date().toISOString().split("T")[0];
      const updated = updateSentenceAfterAnswer(match, correct, q.mode);
      await updateSentence(updated);
      // console.log("✅ Updated sentence weight:", updated.weight, "for", updated.tagalog);
    }

    } catch (err) {
      console.error("Inference error:", err);
      // you might choose to default to false, or fallback to exact‐match here
      correct = false;
    }
  } else {
    // ── For all other fill modes, just do an exact (case‐insensitive) match ──
    const normalized = (s: string) => s.trim().toLowerCase();
    const translations = Array.isArray(q.translation) ? q.translation : [q.translation];
    // console.log("fill translatons: ")
    // console.log(translations)

    // console.log("fill accepteds: ")
    // console.log(q.acceptedAnswers)

    correct = q.acceptedAnswers
      ? q.acceptedAnswers.map(normalized).includes(normalized(userInput))
      : translations.map(normalized).includes(normalized(userInput));
    // console.log("fill correct: ")
    // console.log(correct)


  }

  // ── Now record result & update state ──
  recordQuestionResult(safeTopic, correct);
  if (!correct) {
    recordWrongAnswer({
      topic: safeTopic,
      prompt: q.wordtotranslate,
      correctAnswer: Array.isArray(q.translation) ? q.translation[0] : q.translation,
      userAnswer: userInput.trim(),
      mode: q.mode,
    });
  }
  setIsCorrect(correct);
  setShowCorrectModal(true);
  setAttempts(prev => prev + 1);
  if (correct) setScore(prev => prev + 1);
  setUserInput("");

  // …and only update vocab weights if your topic is "vocab" as before…
}}
        
                  >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>

        </View>
      )}
    </ScrollView>

    

    {showCorrectModal && (
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          {isCorrect ? (
            <Text style={styles.modalText}>✅ Correct!</Text>
          ) : (
            <>
              <Text style={styles.modalText}>❌ Wrong!</Text>
              <Text style={styles.correctAnswerText}>
                Correct Answer: {
                  safeTopic === "vocab"
                    ? Array.isArray(questions[questionIndex].acceptedAnswers)
                      ? questions[questionIndex].acceptedAnswers.join(", ")
                      : questions[questionIndex].acceptedAnswers
                    : questions[questionIndex].translation
                }



              </Text>
            </>
          )}


          <TouchableOpacity
            onPress={() => {

              const isLast = questionIndex + 1 === questions.length;
               if (isLast) {
                 // record the quiz result into history
                 recordQuiz(safeTopic as any, score, attempts);
                //  console.log("recorded quiz")
               }
              setShowCorrectModal(false);
              if (questionIndex + 1 < questions.length) {
                setQuestionIndex(questionIndex + 1);
              } else {
                router.push("/dashboard");
              }
            }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    )}


    <View style={styles.bottomNavigation}>
      <TouchableOpacity onPress={() => router.push("/dictionary")} 
        style={styles.navItem}>
         <Image
          source={require("../assets/images/material-symbols_dictionary.png")}
          style={[styles.navIcon, { width: 50, height: 50 }]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/study")}
        style={styles.navItem}>
        <Image
          source={require("../assets/images/desk.png")}
          style={styles.navIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/dashboard")}
        style={styles.navItem}>
         <Image
          source={require("../assets/images/material-symbols_home-outline.png")}
          style={[styles.navIcon, { width: 50, height: 50 }]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/profile")}
        style={styles.navItem}>
        <Image
          source={require("../assets/images/pajamas_profile.png")}
          style={styles.navIcon}
        />
      </TouchableOpacity>
  
  
  
</View>

</View>
    
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    marginTop: 5,
    width: "100%",
    maxWidth: 338,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  profileIcon: {
    width: 45,
    height: 45,
    resizeMode: "contain",
    marginRight: -45,
  },
  titleSection: {
    width: "100%",              // Make the section fill the container
    maxWidth: 480,              // Match your main container's maxWidth
    flexDirection: "row",
    paddingHorizontal: 19,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#DCB0FE", // Purple background
    alignSelf: "center",        // Center the section if maxWidth is set
    marginVertical: 10,              // Optional: space from header
  },
  titleIcon: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },
  titleContainer: {
    width: 266,
  },
  titleText: {
    fontFamily: "Inter",
    fontSize: 20,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "800",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  timerContainer: {
    borderColor: "rgba(0, 0, 0, 1)",
    borderWidth: 3,
    borderRadius: 50,
    paddingHorizontal: 6,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontFamily: "Inter",
    fontSize: 15,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "800",
    textAlign: "center",
  },
  questionCard: {
    borderRadius: 20,
    borderColor: "rgba(0, 0, 0, 1)",
    borderWidth: 1,
    marginTop: 1,
    width: "100%",
    maxWidth: 350,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    backgroundColor: "white"
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionNumber: {},
  questionNumberText: {
    fontFamily: "Inter",
    fontSize: 20,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "800",
    textAlign: "center",
  },
  scoreContainer: {
    borderRadius: 20,
    borderColor: "rgba(0, 0, 0, 1)",
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  scoreText: {
    fontFamily: "Inter",
    fontSize: 20,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "500",
    textAlign: "center",
  },
  questionContent: {
    marginTop: 34,
    alignItems: "center",
  },
  instructionText: {
    fontFamily: "Inter",
    fontSize: 20,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 20,
  },
  WordToTranslate: {
    fontFamily: "Inter",
    fontSize: 45,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "800",
    textAlign: "center",
  },
  optionButton: {
    borderRadius: 20,
    marginTop: 12,
    width: "100%",
    maxWidth: 350,
    paddingHorizontal: 70,
    paddingVertical: 15,
  },
  optionText: {
    fontFamily: "Inter",
    fontSize: 20,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "800",
    textAlign: "center",
  },

  textInput: {
  height: 200,
  width: "90%",
  backgroundColor: "white",
  borderColor: "black",
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 15,
  marginTop: 20,
  fontSize: 18,
},

fillBox: {
  borderRadius: 15,
  padding: 20,
  marginTop: 20,
  width: "90%",
  maxWidth: 350,
  height: 200,
  alignSelf: "center",
},

fillInput: {
  
  borderRadius: 10,
  borderWidth: 2,
  paddingVertical: 12,
  paddingHorizontal: 16,
  height: "100%",
  fontSize: 18,
  borderColor: "black",
  color: "#000",
  textAlignVertical: "top"
},

submitButton: {
  backgroundColor: "green", // Green
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 30,
  marginTop: 15,
  alignSelf: "center",
},

submitButtonText: {
  color: "white",
  fontSize: 18,
  fontWeight: "bold",
},

navItem: {
  padding: 15,
  width: 75,
  height: 75,
  alignItems: "center",
  justifyContent: "center",
  //backgroundColor: "white",
  
},

  bottomNavigation: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#D9D9D9",
    alignSelf: "stretch",
    flexDirection: "row",
    marginTop: 5,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "space-evenly",
    bottom: 0,
    height: 80
  },
  navIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  modalOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
},

modalBox: {
  width: 250,
  padding: 20,
  borderRadius: 15,
  backgroundColor: "white",
  alignItems: "center",
},

modalText: {
  fontSize: 24,
  fontWeight: "bold",
  marginBottom: 20,
},

nextButton: {
  backgroundColor: "green",
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 10,
},

nextButtonText: {
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
},

correctAnswerText: {
  fontSize: 14,
  textAlign: "center",
  color: "#333",
  marginTop: 8,
},




});

function shuffleArray(array: string[]): string[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function isLabel(text: string): boolean {
  return text.startsWith("(") && text.endsWith(")");
}