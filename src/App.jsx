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
const placeholderGeneratedConcepts = [
  { name: 'Concept 1', description: 'A brief description generated from your study material.' },
  { name: 'Placeholder Concept 2', description: 'A brief description generated from your study material.' },
  { name: 'Place Concept 3', description: 'A brief description generated from your study material.' },
  { name: 'Holder Concept 4', description: 'A brief description generated from your study material.' },
];

function App() {
  const CELEBRATION_MS = 1800;
  const [phase, setPhase] = useState('onboarding');
  const [concepts, setConcepts] = useState(defaultConcepts);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [studyFileName, setStudyFileName] = useState('');
  const [conceptSourceLabel, setConceptSourceLabel] = useState('None yet');
  const [showChatbox, setShowChatbox] = useState(true);

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

  const handleRecordingComplete = (capturedTranscript) => {
    setTranscript(capturedTranscript);
    setPhase('celebration');
  };

  const handleAgain = () => {
    setTranscript('');
    setPhase('concept');
  };

  const handleSelectConceptFromFeedback = (index) => {
    setConceptIndex(index);
    setTranscript('');
    setPhase('concept');
  };

  const handleBackToConceptList = () => {
    setTranscript('');
    setPhase('concept-selection');
  };

  const handleStartSession = () => {
    setShowChatbox(false);
    setPhase('concept-selection');
  };

  const handleFileSelected = (fileName) => {
    setStudyFileName(fileName);
  };

  const handleGenerateFromMaterial = () => {
    setConcepts(placeholderGeneratedConcepts);
    setConceptSourceLabel(
      studyFileName ? `Study Material (${studyFileName})` : 'Study Material'
    );
    setConceptIndex(0);
    setTranscript('');
    handleStartSession();
  };

  const handleGenerateConceptsFromChat = () => {
    setConcepts(placeholderGeneratedConcepts);
    setConceptSourceLabel('AI Chatbox');
    setConceptIndex(0);
    setTranscript('');
    handleStartSession();
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
    setStudyFileName('');
    setConceptSourceLabel('None yet');
    setConcepts(defaultConcepts);
    setShowChatbox(true);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-start gap-4 p-4 sm:p-8">
      <HeaderBar large={phase === 'onboarding'} />
      <div className={`grid w-full items-stretch gap-4 ${showChatbox ? 'lg:grid-cols-[1.35fr_1fr] lg:gap-6' : ''}`}>
        <section className="min-h-[34rem] w-full rounded-3xl border border-gray-700 bg-[var(--panel)] p-6 shadow-2xl sm:min-h-[38rem] sm:p-5">
          {phase !== 'onboarding' && phase !== 'celebration' && (
            <div className="mb-8 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                disabled={!canGoBack}
                className="rounded-lg border border-[var(--accent)]/35 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleEndSession}
                className="rounded-lg bg-[var(--warn)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                End Session
              </button>
            </div>
          )}

          {phase === 'onboarding' && (
            <div className="page-enter-pop" key="phase-onboarding">
              <OnboardingScreen
                fileName={studyFileName}
                onFileSelected={handleFileSelected}
                onGenerateFromMaterial={handleGenerateFromMaterial}
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
                onAgain={handleAgain}
                concepts={concepts}
                currentConceptIndex={conceptIndex}
                onSelectConcept={handleSelectConceptFromFeedback}
                onBackToList={handleBackToConceptList}
              />
            </div>
          )}
        </section>

        {showChatbox && <ChatboxPanel onGenerateConceptsFromChat={handleGenerateConceptsFromChat} />}
      </div>
    </main>
  );
}

export default App;
