import ImageEditor from '@unlayer/react-image-editor';
import { usePlaneStore, type Face } from '../store';

const TEMPLATES: Record<Face, string> = {
  'flag-left': '/templates/flag-left.svg',
  'flag-right': '/templates/flag-right.svg',
};

export default function LiveryEditor() {
  const activeFace = usePlaneStore((s) => s.activeFace);
  const saved = usePlaneStore((s) => s.liveries[activeFace]);
  const saveFace = usePlaneStore((s) => s.saveFace);

  return (
    <ImageEditor
      key={activeFace}
      image={saved ?? TEMPLATES[activeFace]}
      minHeight="560px"
      options={{ theme: 'dark' }}
      onSave={({ dataUrl }) => {
        if (dataUrl) saveFace(activeFace, dataUrl);
      }}
    />
  );
}
