const axios = require('axios');
const cheerio = require('cheerio');
const FB = require('fb');

// You will need to fill in your own access token here
FB.setAccessToken('EAALp24Cup50BAMVI1kA4DydhmMFXRZAktDUVRaKqiOZCbOg6Tgydu7lq0o0jzNLoyTYLvPYeV93CShBFiWYFiW1TZCDgmM9IaHUZBvmC4TqpRM5WfvbpBy2l7Cg0d1bhMHCnsXAVxPUMs3FmxF6TxcX4O7g74mPm4b9zW1VBrShrTxmgHb2iYNfi9MRRPRZB4IB4EFtejsQd9e9yh7eVRpCijzneAnlEZD');

const postToFacebook = (message, url) => {
  FB.api('me/feed', 'post', { message: message, link: url }, function (res) {
    if (!res || res.error) {
      console.log(!res ? 'error occurred' : res.error);
      return;
    }
    console.log('Post Id: ' + res.id);
  });
};

// Recursive function to find all properties in an object or its subobjects
const findProperties = (obj, propertyName) => {
  let results = [];
  for (let key in obj) {
    if (key === propertyName) {
      results.push(obj[key]);
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      results = results.concat(findProperties(obj[key], propertyName));
    }
  }
  return results;
};

const fetchPage = async (url) => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Select the script tag with the type 'application/json'
    const scriptContent = $('script[type="application/json"]').html();

    // Parse the content of the script tag as JSON
    const jsonData = JSON.parse(scriptContent);

    // Find all 'articles' properties in the JSON data
    const articlesArrays = findProperties(jsonData, 'articles');

    // Flatten the array of arrays and map each article to the desired format
    const mappedArticles = articlesArrays.flat().map(articles => 
      articles.map(article => ({
        title: article.title.rendered,
        url: article.link
      }))
    ).flat();

    console.dir(mappedArticles, { depth: null });

    mappedArticles.forEach(article => {
      // const message = `${article.title}\n${article.url}`;
      postToFacebook(article.title, article.url);
    });

  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

const url = "https://www.stylist.co.uk/win"; // Replace with your URL
fetchPage(url);

