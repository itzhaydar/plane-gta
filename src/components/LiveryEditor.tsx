import ImageEditor from '@unlayer/react-image-editor';
import { usePlaneStore, type Face } from '../store';

const TEMPLATES: Record<Face, string> = {
  top: '/templates/plane-top.svg',
  bottom: '/templates/plane-bottom.svg',
  left: '/templates/plane-left.svg',
  right: '/templates/plane-right.svg',
  flag: '/templates/plane-flag.svg',
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