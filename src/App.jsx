import { useMemo, useState } from 'react';
import ConceptScreen from './components/ConceptScreen';
import CountdownScreen from './components/CountdownScreen';
import RecordingScreen from './components/RecordingScreen';
import FeedbackScreen from './components/FeedbackScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ChatboxPanel from './components/ChatboxPanel';
import ConceptSelectionScreen from './components/ConceptSelectionScreen';

const defaultConcepts = ['Photosynthesis', "Newton's First Law", 'Mitosis'];
const placeholderGeneratedConcepts = [
  'Placeholder Concept 1',
  'Placeholder Concept 2',
  'Placeholder Concept 3',
  'Placeholder Concept 4',
];

function App() {
  const [phase, setPhase] = useState('onboarding');
  const [concepts, setConcepts] = useState(defaultConcepts);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState([]);
  const [studyFileName, setStudyFileName] = useState('');
  const [conceptSourceLabel, setConceptSourceLabel] = useState('None yet');
  const [showChatbox, setShowChatbox] = useState(true);

  const currentConcept = useMemo(() => concepts[conceptIndex], [conceptIndex]);

  const transitionTo = (nextPhase, { trackHistory = true } = {}) => {
    if (trackHistory) {
      setHistory((prev) => [...prev, phase]);
    }
    setPhase(nextPhase);
  };

  const goBackMap = {
    'concept-selection': 'onboarding',
    'concept': 'concept-selection',
    'feedback': 'concept-selection',
  };

  const canGoBack = Object.keys(goBackMap).includes(phase);

  const goToNextConcept = () => {
    if (concepts.length === 0) {
      return;
    }

    setConceptIndex((prev) => (prev + 1) % concepts.length);
    setTranscript('');
  };

  const handleSkip = () => {
    goToNextConcept();
    setPhase('concept');
  };

  const handleTest = () => {
    transitionTo('countdown');
  };

  const handleCountdownComplete = () => {
    transitionTo('recording');
  };

  const handleRecordingComplete = (capturedTranscript) => {
    setTranscript(capturedTranscript);
    transitionTo('feedback');
  };

  const handleAgain = () => {
    setTranscript('');
    transitionTo('concept');
  };

  const handleSelectConceptFromFeedback = (index) => {
    setConceptIndex(index);
    setTranscript('');
    transitionTo('concept');
  };

  const handleBackToConceptList = () => {
    setTranscript('');
    transitionTo('concept-selection');
  };

  const handleStartSession = () => {
    setShowChatbox(false);
    transitionTo('concept-selection');
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

  const handleGenerateConceptsFromChat = (chatPrompts) => {
    setConcepts(placeholderGeneratedConcepts);
    setConceptSourceLabel('AI Chatbox');
    setConceptIndex(0);
    setTranscript('');
    handleStartSession();
  };

  const handleChooseConcept = (index) => {
    setConceptIndex(index);
    transitionTo('concept');
  };

  const handleGoBack = () => {
    if (phase === 'concept-selection') {
      handleEndSession();
      return;
    }

    const goBackMap = {
      'concept': 'concept-selection',
      'countdown': 'concept-selection',
      'recording': 'concept-selection',
      'feedback': 'concept-selection',
    };

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
    setHistory([]);
    setStudyFileName('');
    setConceptSourceLabel('None yet');
    setConcepts(defaultConcepts);
    setShowChatbox(true);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-4 sm:p-8">
      <div className={`grid w-full gap-4 ${showChatbox ? 'lg:grid-cols-[1.35fr_1fr] lg:gap-6' : ''}`}>
        <section className="w-full rounded-3xl border border-gray-700 bg-[var(--panel)] p-6 shadow-2xl sm:p-10">
          {phase !== 'onboarding' && (
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
            <OnboardingScreen
              fileName={studyFileName}
              onFileSelected={handleFileSelected}
              onGenerateFromMaterial={handleGenerateFromMaterial}
            />
          )}

          {phase === 'concept-selection' && (
            <ConceptSelectionScreen
              concepts={concepts}
              sourceLabel={conceptSourceLabel}
              onChooseConcept={handleChooseConcept}
            />
          )}

        {phase === 'concept' && (
          <ConceptScreen
            concept={currentConcept}
            onSkip={handleSkip}
            onComplete={handleRecordingComplete}
          />
        )}

        {phase === 'feedback' && (
          <FeedbackScreen
            concept={currentConcept}
            transcript={transcript}
            onAgain={handleAgain}
            concepts={concepts}
            currentConceptIndex={conceptIndex}
            onSelectConcept={handleSelectConceptFromFeedback}
            onBackToList={handleBackToConceptList}
          />
        )}

        </section>

        {showChatbox && <ChatboxPanel onGenerateConceptsFromChat={handleGenerateConceptsFromChat} />}
      </div>
    </main>
  );
}

export default App;
