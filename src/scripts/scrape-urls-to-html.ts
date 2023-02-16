import scrape from "website-scraper";
// TODO: Package is broke. Did it manually

let urls: string[] = [
  "https://help.nytimes.com/hc/en-us/articles/360001418606-Report-a-Delivery-Problem",
  "https://help.nytimes.com/hc/en-us/articles/115014925288-How-to-Submit-a-Letter-to-the-Editor",
];

const options = {
  urls,
  directory: "/src/docs/html",
  sources: [
    {
      selector: "article",
    },
  ],
};

async function main() {
  const result = await scrape(options);
  console.log(result);
}

main().catch((err) => console.error(err));
