import { useAppState } from '@/hooks/useAppState';
import HeaderBar from '@/components/HeaderBar';
import LeftGutter from '@/components/LeftGutter';
import EditorPanel from '@/components/EditorPanel';
import PreviewPanel from '@/components/PreviewPanel';
import StatusBar from '@/components/StatusBar';

export default function App() {
  const { state, updateState, setStatus } = useAppState();

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Header */}
      <HeaderBar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden" style={{ gap: 2, padding: 2 }}>
        {/* Left Gutter */}
        <LeftGutter />

        {/* Editor Panel */}
        <EditorPanel
          state={state}
          updateState={updateState}
          setStatus={setStatus}
        />

        {/* Preview Panel */}
        <PreviewPanel state={state} setStatus={setStatus} />
      </div>

      {/* Status Bar */}
      <StatusBar
        statusMessage={state.statusMessage}
        hasImage={!!state.uploadedImage}
      />
    </div>
  );
}
