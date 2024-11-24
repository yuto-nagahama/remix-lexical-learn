import { PhotoIcon } from "@heroicons/react/24/outline";

type Props = {
  onChange: (files: FileList | null) => void;
};

export default function ImageInput({ onChange }: Props) {
  return (
    <label className="btn btn-sm rounded-none">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files)}
      />
      <PhotoIcon className="size-6" />
    </label>
  );
}
