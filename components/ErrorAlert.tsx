interface Props {
  message: string;
}

export function ErrorAlert({ message }: Props) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
      <span className="font-semibold">Error: </span>{message}
    </div>
  );
}
