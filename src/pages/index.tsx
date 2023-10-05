import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { InstillJsonSchema } from "@/lib/transformer";
const transformInstillSchemaToFormTree = () => {};

export default function Home() {
  const form = useForm<any>({
    resolver: zodResolver(z.object({})),
    defaultValues: {},
  });

  return <div></div>;
}
