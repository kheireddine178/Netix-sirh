import { getParametresComplets } from "./actions";
import ParametresForm from "./ParametresForm";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const parametres = await getParametresComplets();
  return <ParametresForm initial={parametres} />;
}
