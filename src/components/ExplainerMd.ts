const explainerMd = `# Overview of demo

This is a demo app showing how generative AI, in this case GPT-3, can be used to provide robust conversational results to queries, using the public New York Times help center content as a reference.

## How to use

Enter a query into the search bar, click \`Search\`, and wait a few seconds while GPT processes the query.

GPT is instructed to only provide an answer if it can back it up with content from our knowledge base. If it can't, you will see a response such a \`I'm sorry I don't know how to help with that...\`, potentially along with some basic information it may have found. Try rephrasing the question (this is an area where we'd fine-tune the prompt and resources in a real app).

If there are screenshots (or, in other types of applications, things like code snippets), GPT can include those directly in it's answers.

**NOTE:** I have this OpenAI key capped at ~$10/mo so don't worry about costs running up. If the app isn't working it may be maxed out, let me know - Tayor McManus

## How does it work?

There is a multi-step process facilitating an approach known as "context injection" to help prevent GPT from hallucinating (aka making up) answers:

### Preparing the dataset of content

To start we need to process our knowledge base articles to ready them for incoming queries:

1. Knowledge base articles are scraped from the web
1. Each page is divided into sections, broken up by headers (eg \`h2\`)
1. Each section is passed into OpenAI's [Embeddings](https://platform.openai.com/docs/guides/embeddings) model to generate an embedding, which is a vector based on the text contents in that section
1. These embeddings, and references to their parent page, are stored in a database, in this case PostgreSQL (via Supabase)

This process can be automated to update embeddings when content changes, and is pretty cheap, it only cost a few cents for 23 pages.

### Handling a query

When a user enters a query, we perform a few steps to generate the final result from GPT:

1. The search query is passed to the same OpenAI Embeddings model to generate a vector for it
1. That vector is then searched against those of our sections in our database, where we can set a threshold for matches
1. We take all the returned sections, and start packing that content into a prompt, starting with the most relevant first, and capping this when we hit a certain token size
1. We then pass that loaded prompt into the [GPT Text Completion](https://platform.openai.com/docs/guides/completion) model, and it gives us a result

The prompt itself is an important piece, and can be fine-tuned. We can also pass certain properties such as \`temperature=0\` to tell GPT to be very deterministic about its responses (meaning if we were to give it the same query multiple times, we'd get the same result each time, given the same source information).

## Disclaimer

This is a demo project, in no way condoned by or representing the New York Times. If you somehow stumbled on this application and need actual help on a NYT issue, go to the [New York Times Help Center](https://help.nytimes.com/hc/en-us).
`;
export default explainerMd;
