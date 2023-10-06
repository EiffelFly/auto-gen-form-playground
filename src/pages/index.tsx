import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Home() {
  const form = useForm<any>({
    resolver: zodResolver(z.object({})),
    defaultValues: {},
  });

  return <div></div>;
}
