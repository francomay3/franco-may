import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Stack, Card, Button } from "@/components/design-system";
import { useTheme } from "@emotion/react";
import { AnimatePresence, motion } from "framer-motion";
import { getChatAnswer } from "@/utils/openAi/openAi";

type History = { user: "nata" | "franco"; message: string }[];

export default function Home() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<History>([
    { user: "franco", message: "hola babygirl" },
  ]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const lastMessage = history[history.length - 1];
    if (lastMessage?.user === "nata") {
      getChatAnswer({ history })
        .then((answer) => {
          console.log(answer);
          const newHistory: History = [
            ...history,
            { user: "franco", message: answer },
          ];
          setHistory(newHistory);
          setLoading(false);
        })
        .catch((error) => {
          alert(error.message);
        });
    }
  }, [history]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setHistory((prev) => [...prev, { user: "nata", message }]);
    setLoading(true);
    setMessage("");
  };

  return (
    <AnimatePresence>
      <Layout>
        <Stack>
          <h1>Chat with my alter ego</h1>
          <Card style={{ width: "100%" }}>
            <Stack
              style={{
                width: "100%",
              }}
              gap={4}
            >
              {history.map(({ user, message }) => {
                const isHuman = user === "nata";
                return (
                  <motion.div
                    style={{
                      alignSelf: isHuman ? "flex-end" : "flex-start",
                    }}
                    key={message}
                    initial={{ opacity: 0, x: isHuman ? "-20%" : "20%" }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isHuman ? "20%" : "-20%" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      key={message}
                      style={{
                        backgroundColor: isHuman
                          ? theme.colors.darkBlue
                          : theme.colors.darkGreen,
                        color: "white",
                      }}
                    >
                      {message}
                    </Card>
                  </motion.div>
                );
              })}
            </Stack>
          </Card>
          <form onSubmit={handleSubmit}>
            <Card style={{ width: "100%", gap: theme.spacing[2] }}>
              <input
                style={{ flex: 1 }}
                type="text"
                name="message"
                placeholder="Write message"
                value={message}
                onChange={(e) => !loading && setMessage(e.target.value)}
              />
              <Button onClick={handleSubmit}>
                {loading ? "Loading..." : "Send"}
              </Button>
            </Card>
          </form>
        </Stack>
      </Layout>
    </AnimatePresence>
  );
}
