import { useEffect, useMemo, useRef, useState } from 'react';
import { HiMiniMicrophone } from 'react-icons/hi2';
import ConceptScreen from './components/ConceptScreen';
import FeedbackScreen from './components/FeedbackScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ChatboxPanel from './components/ChatboxPanel';
import ConceptSelectionScreen from './components/ConceptSelectionScreen';
import HeaderBar from './components/HeaderBar';
import CelebrationTransition from './components/CelebrationTransition';

const defaultConcepts = [
  { name: 'Photosynthesis', description: 'The process by which plants convert sunlight into energy.' },
  { name: "Newton's First Law", description: 'An object at rest stays at rest unless acted on by a force.' },
  { name: 'Mitosis', description: 'Cell division producing two genetically identical daughter cells.' },
];

const API = 'http://localhost:8000';

function App() {
  const CELEBRATION_MS = 1800;
  const FINISH_CONFIRM_MS = 2000;
  const [phase, setPhase] = useState('onboarding');
  const [concepts, setConcepts] = useState(defaultConcepts);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyFile, setStudyFile] = useState(null); // actual File object
  const [conceptSourceLabel, setConceptSourceLabel] = useState('None yet');
  const [showChatbox, setShowChatbox] = useState(true);
  const [isVoiceModeOn, setIsVoiceModeOn] = useState(false);
  const [voiceStartSignal, setVoiceStartSignal] = useState(0);
  const [voiceStopSignal, setVoiceStopSignal] = useState(0);
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState('');
  const [voiceCommandNote, setVoiceCommandNote] = useState('');
  const [voiceAudioBars, setVoiceAudioBars] = useState(() => Array(18).fill(0.04));
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const recognitionRef = useRef(null);
  const finishPendingRef = useRef(false);
  const finishTimeoutRef = useRef(null);
  const phaseRef = useRef(phase);
  const conceptsRef = useRef(concepts);
  const conceptIndexRef = useRef(conceptIndex);
  const speechAudioRef = useRef(null);
  const speechAbortRef = useRef(null);
  const browserUtteranceRef = useRef(null);
  const listenAnalyserRef = useRef(null);
  const listenAudioCtxRef = useRef(null);
  const listenAnimFrameRef = useRef(null);
  const spokenFeedbackKeyRef = useRef('');
  const spokenPromptsRef = useRef(new Set());
  const aiFeedbackRef = useRef(aiFeedback);
  const transcriptRef = useRef(transcript);
  const isAnalyzingRef = useRef(isAnalyzing);

  const studyFileName = studyFile?.name || '';
  const currentConcept = useMemo(() => concepts[conceptIndex], [concepts, conceptIndex]);

  const goBackMap = {
    'concept-selection': 'onboarding',
    'concept': 'concept-selection',
    'feedback': 'concept-selection',
  };

  const canGoBack = Object.keys(goBackMap).includes(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    conceptsRef.current = concepts;
  }, [concepts]);

  useEffect(() => {
    conceptIndexRef.current = conceptIndex;
  }, [conceptIndex]);

  useEffect(() => {
    aiFeedbackRef.current = aiFeedback;
  }, [aiFeedback]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    if (phase !== 'celebration') {
      return undefined;
    }

    const timer = setTimeout(() => {
      setPhase('feedback');
    }, CELEBRATION_MS);

    return () => clearTimeout(timer);
  }, [phase]);

  const handleRecordingComplete = async (audioBlob) => {
    setPhase('celebration');
    setIsAnalyzing(true);
    setTranscript('');
    setAiFeedback(null);

    try {
      // Send audio blob + concept info as multipart form to /api/analyze
      // Backend handles STT (Groq Whisper) then LLM feedback (Groq Llama 3)
      const formData = new FormData();
      formData.append('concept_name', currentConcept.name);
      formData.append('concept_definition', currentConcept.description);
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      const res = await fetch(`${API}/api/analyze`, { method: 'POST', body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Analysis failed');
      }

      const data = await res.json();
      setTranscript(data.transcript || '');
      setAiFeedback(data.feedback);
    } catch (err) {
      console.error('Analysis error:', err);
      setAiFeedback({
        rating: null,
        correctPoints: [],
        missingPoints: [],
        summary: "Sorry, I couldn't hear you...",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAgain = () => {
    setTranscript('');
    setAiFeedback('');
    setPhase('concept');
  };

  const handleSelectConceptFromFeedback = (index) => {
    setConceptIndex(index);
    setTranscript('');
    setAiFeedback('');
    setPhase('concept');
  };

  const handleBackToConceptList = () => {
    setTranscript('');
    setAiFeedback('');
    setPhase('concept-selection');
  };

  const handleStartSession = () => {
    setShowChatbox(false);
    setPhase('concept-selection');
  };

  const handleFileSelected = (file) => {
    setStudyFile(file);
  };

  const handleGenerateFromMaterial = async () => {
    if (!studyFile) return;
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', studyFile);
      const res = await fetch(`${API}/api/extract-concepts`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to extract concepts');
      }
      const data = await res.json();
      setConcepts(data.concepts);
      setConceptSourceLabel(`Study Material (${studyFileName})`);
      setConceptIndex(0);
      setTranscript('');
      setAiFeedback('');
      handleStartSession();
    } catch (err) {
      console.error('Extract concepts error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateConceptsFromChat = async (chatMessages) => {
    const conversationText = (chatMessages || [])
      .map(({ role, text }) => `${role === 'assistant' ? 'Tutor' : 'Student'}: ${text}`)
      .join('\n\n')
      .trim();

    if (!conversationText) return;

    setIsGenerating(true);

    try {
      const chatFile = new File([conversationText], 'chat-knowledge.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', chatFile);

      const res = await fetch(`${API}/api/extract-concepts`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to extract concepts from chat');
      }

      const data = await res.json();
      setConcepts(data.concepts);
      setConceptSourceLabel('AI Chatbox');
      setConceptIndex(0);
      setTranscript('');
      setAiFeedback(null);
      handleStartSession();
    } catch (err) {
      console.error('Extract chat concepts error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChooseConcept = (index) => {
    setConceptIndex(index);
    setPhase('concept');
  };

  const handleGoBack = () => {
    if (phase === 'concept-selection') {
      handleEndSession();
      return;
    }

    const nextPhase = goBackMap[phase];
    if (nextPhase) {
      setPhase(nextPhase);
      setTranscript('');
    }
  };

  const handleEndSession = () => {
    if (speechAbortRef.current) {
      speechAbortRef.current.abort();
      speechAbortRef.current = null;
    }
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current.currentTime = 0;
      speechAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    browserUtteranceRef.current = null;
    spokenFeedbackKeyRef.current = '';
    spokenPromptsRef.current = new Set();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    finishPendingRef.current = false;
    setIsVoiceModeOn(false);
    setVoiceLiveTranscript('');
    setVoiceCommandNote('');
    setPhase('onboarding');
    setConceptIndex(0);
    setTranscript('');
    setAiFeedback('');
    setStudyFile(null);
    setConceptSourceLabel('None yet');
    setConcepts(defaultConcepts);
    setShowChatbox(true);
  };

  const speakVoicePrompt = async (text, options = {}) => {
    const { force = false } = options;
    if (!text?.trim()) return;
    if (!force && !isVoiceModeOn) return;

    const speakWithBrowserTTS = () =>
      new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
          resolve(false);
          return;
        }
        try {
          window.speechSynthesis.cancel();
          const utterance = new window.SpeechSynthesisUtterance(text);
          browserUtteranceRef.current = utterance;
          utterance.rate = 1;
          utterance.pitch = 1;
          utterance.onend = () => {
            if (browserUtteranceRef.current === utterance) {
              browserUtteranceRef.current = null;
            }
            resolve(true);
          };
          utterance.onerror = () => {
            if (browserUtteranceRef.current === utterance) {
              browserUtteranceRef.current = null;
            }
            resolve(false);
          };
          window.speechSynthesis.speak(utterance);
        } catch {
          resolve(false);
        }
      });

    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current.currentTime = 0;
      speechAudioRef.current = null;
    }
    if (speechAbortRef.current) {
      speechAbortRef.current.abort();
      speechAbortRef.current = null;
    }

    // Small delay to ensure clean cutoff
    await new Promise((r) => setTimeout(r, 50));

    const controller = new AbortController();
    speechAbortRef.current = controller;

    try {
      const res = await fetch(`${API}/api/tts-elevenlabs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        speechAbortRef.current = null;
        await speakWithBrowserTTS();
        return;
      }

      const audioBlob = await res.blob();
      if (!audioBlob.size) {
        speechAbortRef.current = null;
        await speakWithBrowserTTS();
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      speechAudioRef.current = audio;
      speechAbortRef.current = null;

      try {
        await audio.play();
      } catch {
        URL.revokeObjectURL(audioUrl);
        if (speechAudioRef.current === audio) {
          speechAudioRef.current = null;
        }
        await speakWithBrowserTTS();
        return;
      }

      await new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (speechAudioRef.current === audio) {
            speechAudioRef.current = null;
          }
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (speechAudioRef.current === audio) {
            speechAudioRef.current = null;
          }
          resolve();
        };
      });
    } catch {
      speechAbortRef.current = null;
      await speakWithBrowserTTS();
    }
  };

  const normalizeForMatch = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const resolveConceptIndexFromCommand = (spokenConcept) => {
    const activeConcepts = conceptsRef.current;
    const target = normalizeForMatch(spokenConcept);
    if (!target) return -1;

    let index = activeConcepts.findIndex((c) => normalizeForMatch(c.name) === target);
    if (index !== -1) return index;

    index = activeConcepts.findIndex((c) => normalizeForMatch(c.name).includes(target));
    if (index !== -1) return index;

    return activeConcepts.findIndex((c) => target.includes(normalizeForMatch(c.name)));
  };

  const parseVoiceCommand = (spokenText) => {
    const text = spokenText.toLowerCase().trim();
    const normalized = normalizeForMatch(spokenText);
    if (!text) return null;

    if (normalized === 'finish test') {
      return { type: 'finish-test' };
    }

    const endSessionPattern = /\bend(?:\s+the)?\s+session\b/;
    if (endSessionPattern.test(text)) {
      return { type: 'end-session' };
    }

    const conceptListPattern = /\b(concept|concepts)\s+list\b/i;
    if (conceptListPattern.test(text)) {
      return { type: 'concept-list' };
    }

    const testPattern = /\btest\s+([a-z0-9'\-\s]+)/i;
    const testMatch = text.match(testPattern);
    if (testMatch?.[1]) {
      return { type: 'test', payload: testMatch[1].trim() };
    }

    const readyPattern = /\b(ready|start(?:\s+(?:recording|test))?)\b/;
    if (readyPattern.test(text)) {
      return { type: 'ready' };
    }

    const againPattern = /\b(again|retry|one more time)\b/;
    if (againPattern.test(text)) {
      return { type: 'again' };
    }

    const readConceptPattern = /\bread\s+(?:the\s+)?concept\b/i;
    if (readConceptPattern.test(text)) {
      return { type: 'read-concept' };
    }

    const goBackPattern = /\bgo\s+back\b/i;
    if (goBackPattern.test(text)) {
      return { type: 'go-back' };
    }

    return null;
  };

  const armFinishTestConfirmation = () => {
    if (phaseRef.current !== 'concept') {
      setVoiceCommandNote('Finish test heard: open a concept first');
      return;
    }

    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
    }

    finishPendingRef.current = true;
    setVoiceCommandNote('Finish test heard. Stay silent for 2s to confirm.');

    finishTimeoutRef.current = setTimeout(() => {
      finishPendingRef.current = false;
      finishTimeoutRef.current = null;
      setVoiceCommandNote('Command recognized: Finish test');
      setVoiceStopSignal((s) => s + 1);
    }, FINISH_CONFIRM_MS);
  };

  const cancelPendingFinishTest = (note = '') => {
    if (!finishPendingRef.current && !finishTimeoutRef.current) return;
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    finishPendingRef.current = false;
    if (note) setVoiceCommandNote(note);
  };

  const runVoiceCommand = (spokenText) => {
    if (phaseRef.current === 'onboarding' || conceptsRef.current.length === 0) return;

    const command = parseVoiceCommand(spokenText);
    if (!command) return;

    if (command.type !== 'finish-test') {
      cancelPendingFinishTest();
    }

    if (command.type === 'finish-test') {
      armFinishTestConfirmation();
      return;
    }

    if (command.type === 'end-session') {
      setVoiceCommandNote('Command recognized: End session');
      handleEndSession();
      return;
    }

    if (command.type === 'concept-list') {
      const names = conceptsRef.current.map((c) => c.name);
      if (names.length === 0) {
        setVoiceCommandNote('No concepts loaded');
        return;
      }
      setVoiceCommandNote('Reading concept list...');
      const speech = `These are the concepts for this study session: ${names.join(', ')}.`;
      void speakVoicePrompt(speech, { force: true });
      return;
    }

    if (command.type === 'again') {
      setVoiceCommandNote('Command recognized: Again');
      handleAgain();
      return;
    }

    if (command.type === 'read-concept') {
      if (phaseRef.current !== 'concept') {
        setVoiceCommandNote('Read concept: open a concept first');
        return;
      }
      const concept = conceptsRef.current[conceptIndexRef.current];
      if (!concept) {
        setVoiceCommandNote('Read concept: no concept found');
        return;
      }
      setVoiceCommandNote('Reading concept...');
      const conceptText = `${concept.name}. ${concept.description}`;
      void speakVoicePrompt(conceptText, { force: true });
      return;
    }

    if (command.type === 'go-back') {
      setVoiceCommandNote('Command recognized: Go back');
      handleGoBack();
      return;
    }

    if (command.type === 'ready') {
      if (phaseRef.current === 'concept') {
        setVoiceCommandNote('Command recognized: Ready');
        setVoiceStartSignal((s) => s + 1);
      } else {
        setVoiceCommandNote('Ready heard: open a concept first');
      }
      return;
    }

    if (command.type === 'test') {
      const matchedIndex = resolveConceptIndexFromCommand(command.payload || '');
      if (matchedIndex !== -1) {
        setVoiceCommandNote(`Command recognized: Test ${conceptsRef.current[matchedIndex].name}`);
        setConceptIndex(matchedIndex);
        setTranscript('');
        setAiFeedback('');
        setPhase('concept');
      } else {
        setVoiceCommandNote('Test command heard, but concept not found');
      }
    }
  };

  const handleSectionVoiceClick = () => {
    if (phaseRef.current === 'onboarding' || conceptsRef.current.length === 0) return;

    if (isVoiceModeOn && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      cancelPendingFinishTest();
      setIsVoiceModeOn(false);
      setVoiceLiveTranscript('');
      setVoiceCommandNote('');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice commands are not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const heard = event.results[i][0].transcript || '';
        if (event.results[i].isFinal) {
          setVoiceLiveTranscript(heard.trim());
          if (finishPendingRef.current && normalizeForMatch(heard) !== 'finish test') {
            cancelPendingFinishTest('Finish test canceled: other words detected');
          }
          runVoiceCommand(heard);
        } else {
          interimText += `${heard} `;
          if (finishPendingRef.current && normalizeForMatch(heard) && normalizeForMatch(heard) !== 'finish test') {
            cancelPendingFinishTest('Finish test canceled: other words detected');
          }
        }
      }
      if (interimText.trim()) {
        setVoiceLiveTranscript(interimText.trim());
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      cancelPendingFinishTest();
      setIsVoiceModeOn(false);
      setVoiceLiveTranscript('');
      setVoiceCommandNote('');
    };

    recognition.onerror = () => {
      recognition.stop();
    };

    recognition.start();
    recognitionRef.current = recognition;
    spokenPromptsRef.current = new Set();
    setIsVoiceModeOn(true);
    setVoiceLiveTranscript('Listening...');
    setVoiceCommandNote('');
    spokenPromptsRef.current.add('welcome');

    // Pre-guard page-specific keys so useEffects don't double-fire while welcome plays
    const voiceOnPhase = phaseRef.current;
    const voiceOnIndex = conceptIndexRef.current;
    if (voiceOnPhase === 'concept-selection') {
      spokenPromptsRef.current.add('concept-selection-prompt');
    }
    if (voiceOnPhase === 'concept' && conceptsRef.current[voiceOnIndex]?.name) {
      spokenPromptsRef.current.add(`ready-${voiceOnIndex}`);
    }
    if (voiceOnPhase === 'feedback') {
      const fb = aiFeedbackRef.current;
      const tx = transcriptRef.current;
      if (fb && !isAnalyzingRef.current) {
        spokenFeedbackKeyRef.current = `${voiceOnIndex}::${tx || ''}::${fb?.summary || ''}`;
      }
    }

    // Speak welcome, then immediately follow with the current page's prompt
    (async () => {
      await speakVoicePrompt('Welcome to voice mode. Say end session to stop the study or go back to previous page.', { force: true });
      const currentPhase = phaseRef.current;
      const currentIndex = conceptIndexRef.current;
      if (currentPhase === 'concept' && conceptsRef.current[currentIndex]?.name) {
        void speakVoicePrompt('Say Ready when you are ready to record and finish test to end early. Or, Say go back to return to concept list.', { force: true });
      } else if (currentPhase === 'feedback') {
        const fb = aiFeedbackRef.current;
        const tx = transcriptRef.current;
        if (fb && !isAnalyzingRef.current) {
          const feedbackKey = `${currentIndex}::${tx || ''}::${fb?.summary || ''}`;
          spokenFeedbackKeyRef.current = feedbackKey;
          const summaryText = fb.summary || 'Feedback is ready.';
          const feedbackSpeech = `${summaryText} Try again or with another topic.`.replace(/\s+/g, ' ').trim();
          void speakVoicePrompt(feedbackSpeech, { force: true });
        }
      } else if (currentPhase === 'concept-selection') {
        void speakVoicePrompt('Say test, then a concept name to test your memory on it. Say concept list to hear all topics.', { force: true });
      }
    })();
  };

  useEffect(() => {
    if (phase !== 'concept-selection') {
      spokenPromptsRef.current.delete('concept-selection-prompt');
      return;
    }
    if (!isVoiceModeOn) return;
    const key = 'concept-selection-prompt';
    if (spokenPromptsRef.current.has(key)) return;
    spokenPromptsRef.current.add(key);
    void speakVoicePrompt('Say Test, along with a concept name to test yourself, or Concept List to hear all the available concept names.');
  }, [phase, isVoiceModeOn]);

  useEffect(() => {
    if (phase !== 'concept') {
      for (const key of Array.from(spokenPromptsRef.current)) {
        if (key.startsWith('ready-')) {
          spokenPromptsRef.current.delete(key);
        }
      }
      return;
    }
    if (!isVoiceModeOn) return;
    if (!currentConcept?.name) return;
    const key = `ready-${conceptIndex}`;
    if (spokenPromptsRef.current.has(key)) return;
    spokenPromptsRef.current.add(key);
    void speakVoicePrompt('Say Ready when you are ready to record. Say go back to concept list, or finish test to end early.');
  }, [phase, conceptIndex, isVoiceModeOn]);

  useEffect(() => {
    if (phase !== 'feedback') {
      spokenFeedbackKeyRef.current = '';
      return;
    }
    if (!isVoiceModeOn || isAnalyzing || !aiFeedback) return;

    const feedbackKey = `${conceptIndex}::${transcript || ''}::${aiFeedback?.summary || ''}`;
    if (spokenFeedbackKeyRef.current === feedbackKey) return;
    spokenFeedbackKeyRef.current = feedbackKey;

    const summaryText = aiFeedback.summary || 'Feedback is ready.';

    const feedbackSpeech = `${summaryText} Try again or with another topic.`
      .replace(/\s+/g, ' ')
      .trim();

    void speakVoicePrompt(feedbackSpeech);
  }, [phase, isVoiceModeOn, isAnalyzing, aiFeedback, transcript, conceptIndex]);

  // Run a mic analyser for the visualizer bars whenever voice mode is on but not recording
  useEffect(() => {
    if (!isVoiceModeOn || isRecordingVoice) {
      // Stop listener analyser — recording will drive bars instead, or voice is off
      if (listenAnimFrameRef.current) {
        cancelAnimationFrame(listenAnimFrameRef.current);
        listenAnimFrameRef.current = null;
      }
      listenAnalyserRef.current = null;
      if (listenAudioCtxRef.current) {
        listenAudioCtxRef.current.close();
        listenAudioCtxRef.current = null;
      }
      if (!isRecordingVoice) {
        setVoiceAudioBars(Array(18).fill(0.04));
      }
      return;
    }

    let stream;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      stream = s;
      const audioContext = new window.AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      const source = audioContext.createMediaStreamSource(s);
      source.connect(analyser);
      listenAudioCtxRef.current = audioContext;
      listenAnalyserRef.current = analyser;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 18;
      const tick = () => {
        if (!listenAnalyserRef.current) return;
        listenAnalyserRef.current.getByteFrequencyData(freqData);
        const nextBars = Array.from({ length: barCount }, (_, i) => {
          const idx = Math.floor((i / barCount) * freqData.length);
          return Math.max(0.04, Math.min(1, (freqData[idx] / 255) * 2.8));
        });
        setVoiceAudioBars(nextBars);
        listenAnimFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }).catch(() => {});

    return () => {
      if (listenAnimFrameRef.current) {
        cancelAnimationFrame(listenAnimFrameRef.current);
        listenAnimFrameRef.current = null;
      }
      listenAnalyserRef.current = null;
      if (listenAudioCtxRef.current) {
        listenAudioCtxRef.current.close();
        listenAudioCtxRef.current = null;
      }
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [isVoiceModeOn, isRecordingVoice]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
      if (speechAbortRef.current) {
        speechAbortRef.current.abort();
      }
      if (speechAudioRef.current) {
        speechAudioRef.current.pause();
        speechAudioRef.current.currentTime = 0;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      browserUtteranceRef.current = null;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-start gap-3 p-3 sm:gap-4 sm:p-6">
      <HeaderBar
        large={phase === 'onboarding'}
        showActions={phase !== 'onboarding' && phase !== 'celebration'}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        onEndSession={handleEndSession}
      />
      <div className={`flex w-full flex-col gap-4 sm:gap-6 ${showChatbox ? 'flex-1 lg:h-[calc(100svh-9rem)] lg:flex-row lg:items-stretch' : ''}`}>
        <section className={`relative flex w-full flex-col rounded-3xl border border-gray-700 bg-[var(--panel)] p-6 shadow-2xl sm:p-5 ${showChatbox ? 'lg:h-full lg:min-h-0 lg:w-[34%] lg:shrink-0' : 'min-h-[34rem] sm:min-h-[38rem]'}`}>
          {phase === 'onboarding' && (
            <div className="hidden sm:block fixed bottom-4 right-4 z-50">
              <p className="rounded-xl border border-gray-700 bg-[#1b1b1b]/90 px-3 py-2 text-[11px] text-[var(--text-soft)] shadow-lg backdrop-blur">
                Voice mode available after concepts are generated!
              </p>
            </div>
          )}

          {phase !== 'onboarding' && (
            <>
              {/* Voice button fixed bottom-right; panel stacks above it when active */}
              <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-stretch gap-2 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto sm:items-end sm:p-0">
                {isVoiceModeOn && (
                  <div className="w-full rounded-xl border border-gray-700 bg-[#1b1b1b]/95 p-3 text-[11px] text-[var(--text-soft)] shadow-2xl backdrop-blur sm:w-52">
                    <div className="mb-2 flex h-8 w-full items-end justify-center gap-[2px]">
                      {voiceAudioBars.map((level, i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-cyan-400/80 transition-[height] duration-75"
                          style={{ height: `${4 + level * 24}px` }}
                        />
                      ))}
                    </div>
                    {/* Live transcript at top */}
                    <div className="mb-2 rounded-md border border-gray-700 bg-[#111] p-2">
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">Listening</p>
                      <p className="text-[11px] text-[var(--text-main)]">{voiceLiveTranscript || '...'}</p>
                    </div>
                    {voiceCommandNote && (
                      <p className="mb-2 text-[10px] font-semibold text-green-400">{voiceCommandNote}</p>
                    )}
                    {/* Phase-specific commands */}
                    <p className="mb-1 font-semibold text-[var(--text-main)]">Commands</p>
                    {phase === 'concept-selection' && (
                      <p className="overflow-x-auto whitespace-nowrap">Test [concept name], Concept list, End session</p>
                    )}
                    {phase === 'concept' && (
                      <p className="overflow-x-auto whitespace-nowrap">Ready, Read concept, Go back, Concept list, Finish test (+ 4s silence), End session</p>
                    )}
                    {phase === 'feedback' && (
                      <p className="overflow-x-auto whitespace-nowrap">Again, Concept list, End session</p>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSectionVoiceClick}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--accent)]/35 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-blue-950 sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm bg-[#1b1b1b]/90 shadow-lg backdrop-blur"
                >
                  <HiMiniMicrophone className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
                  <span>{isVoiceModeOn ? 'Voice On' : 'Voice'}</span>
                </button>
              </div>
            </>
          )}

          {phase === 'onboarding' && (
            <div className="page-enter-pop flex-1" key="phase-onboarding">
              <OnboardingScreen
                fileName={studyFileName}
                onFileSelected={handleFileSelected}
                onGenerateFromMaterial={handleGenerateFromMaterial}
                isGenerating={isGenerating}
              />
            </div>
          )}

          {phase === 'concept-selection' && (
            <div className="page-enter-slide" key="phase-concept-selection">
              <ConceptSelectionScreen
                concepts={concepts}
                sourceLabel={conceptSourceLabel}
                onChooseConcept={handleChooseConcept}
              />
            </div>
          )}

          {phase === 'concept' && (
            <div className="page-enter-swivel" key="phase-concept">
              <ConceptScreen
                concept={currentConcept}
                onComplete={handleRecordingComplete}
                startRecordingSignal={voiceStartSignal}
                stopRecordingSignal={voiceStopSignal}
                isVoiceModeOn={isVoiceModeOn}
                onAudioBars={setVoiceAudioBars}
                onRecordingStateChange={setIsRecordingVoice}
              />
            </div>
          )}

          {phase === 'celebration' && (
            <div className="page-enter-pop h-full" key="phase-celebration">
              <CelebrationTransition />
            </div>
          )}

          {phase === 'feedback' && (
            <div className="page-enter-fall" key="phase-feedback">
              <FeedbackScreen
                concept={currentConcept}
                transcript={transcript}
                aiFeedback={aiFeedback}
                isAnalyzing={isAnalyzing}
                onAgain={handleAgain}
                concepts={concepts}
                currentConceptIndex={conceptIndex}
                onSelectConcept={handleSelectConceptFromFeedback}
                onBackToList={handleBackToConceptList}
              />
            </div>
          )}
        </section>

        {showChatbox && <ChatboxPanel onGenerateConceptsFromChat={handleGenerateConceptsFromChat} apiUrl={API} />}
      </div>
    </main>
  );
}

export default App;
