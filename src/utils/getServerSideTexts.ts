import { getTextkeys } from "@/utils/textkeysUtils";

export async function getServerSideProps() {
  try {
    const textkeys = await getTextkeys();
    return {
      props: {
        textkeys,
      },
    };
  } catch (error) {
    return { props: { textkeys: {} } };
  }
}
