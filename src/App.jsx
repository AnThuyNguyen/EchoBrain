import { useEffect, useMemo, useState } from 'react';
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

  const studyFileName = studyFile?.name || '';
  const currentConcept = useMemo(() => concepts[conceptIndex], [concepts, conceptIndex]);

  const goBackMap = {
    'concept-selection': 'onboarding',
    'concept': 'concept-selection',
    'feedback': 'concept-selection',
  };

  const canGoBack = Object.keys(goBackMap).includes(phase);

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
        summary: `Could not analyse your explanation: ${err.message}. Please check the backend and try again.`,
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
    setPhase('onboarding');
    setConceptIndex(0);
    setTranscript('');
    setAiFeedback('');
    setStudyFile(null);
    setConceptSourceLabel('None yet');
    setConcepts(defaultConcepts);
    setShowChatbox(true);
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-start gap-3 p-3 sm:gap-4 sm:p-6">
      <HeaderBar
        large={phase === 'onboarding'}
        showActions={phase !== 'onboarding' && phase !== 'celebration'}
        canGoBack={canGoBack}
        onGoBack={handleGoBack}
        onEndSession={handleEndSession}
      />
      <div className={`flex w-full flex-col gap-4 sm:gap-6 ${showChatbox ? 'flex-1 lg:flex-row lg:items-stretch' : ''}`}>
        <section className={`w-full rounded-3xl border border-gray-700 bg-[var(--panel)] p-6 shadow-2xl sm:p-5 ${showChatbox ? 'lg:w-[34%] lg:shrink-0' : 'min-h-[34rem] sm:min-h-[38rem]'}`}>
          {phase === 'onboarding' && (
            <div className="page-enter-pop" key="phase-onboarding">
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
