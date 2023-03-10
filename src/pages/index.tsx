import { useState, useEffect } from "react";
import Head from "next/head";
import ReactMarkdown from "react-markdown";
import {
  Flex,
  Text,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Spinner,
} from "@chakra-ui/react";
import explainerMd from "../components/ExplainerMd";
// import styles from "@/styles/Home.module.css";

export default function Home() {
  const [term, setTerm] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);

  const search = () => {
    if (!term) return;

    setResponse(null);
    setLoading(true);
    fetch(`/api/gpt-search?q=${term}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setResponse(data.response);
        setLoading(false);
      });
  };

  return (
    <>
      <Head>
        <title>GPT KB Search</title>
        <meta name='description' content='Generated by create next app' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Flex
        direction='column'
        p={12}
        alignItems='center'
        minH='100vh'
        w='full'
        mx='auto'
        maxW='5xl'
        overflowX='hidden'
      >
        <Card w='full' mb={12}>
          <CardBody>
            <Heading size='sm' mb={2}>
              Search NYT public help center
            </Heading>

            <Flex>
              <Input
                value={term}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTerm(e.target.value)
                }
                size='lg'
                placeholder='How do I cancel my subscription?'
              />
              <Button
                size='lg'
                isLoading={isLoading}
                loadingText='GPT Processing'
                onClick={() => search()}
              >
                Search
              </Button>
            </Flex>

            <Flex direction='column' h={"24rem"} overflowY='auto' p={4}>
              {isLoading && (
                <Flex
                  direction='column'
                  alignItems='center'
                  justifyContent='center'
                  flexGrow={1}
                >
                  <Spinner size='xl' />
                </Flex>
              )}
              {!isLoading && !response && (
                <Flex
                  direction='column'
                  alignItems='center'
                  justifyContent='center'
                  flexGrow={1}
                >
                  <Text>
                    Enter a query above to see a GPT-enabled search of the
                    public NYT help center
                  </Text>
                </Flex>
              )}
              {response && (
                <Flex className='md' direction='column'>
                  <ReactMarkdown>{response}</ReactMarkdown>
                </Flex>
              )}
            </Flex>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Flex className='md' direction='column'>
              <ReactMarkdown>{explainerMd}</ReactMarkdown>
            </Flex>
          </CardBody>
        </Card>
      </Flex>
    </>
  );
}
