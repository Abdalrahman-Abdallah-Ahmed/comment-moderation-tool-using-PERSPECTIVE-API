value: function () {
  const { replyText } = this.state;
  const { user, parent, createComment, updateCfActive } = this.props;

  // Define configuration
  const API_KEY = //Your API key
  const API_URL = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;
  const THRESHOLD = 0.7;

  // Payload for the Perspective API
  const payload = {
    comment: { text: replyText.trim() },
    languages: ["en"],
    requestedAttributes: {
      TOXICITY: {},
      INSULT: {},
      PROFANITY: {}
    }
  };

  // Analyze comment for inappropriate content
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(response => {
      if (!response.ok) throw new Error("API request failed");
      return response.json();
    })
    .then(({ attributeScores }) => {
      const isInappropriate = ["TOXICITY", "INSULT", "PROFANITY"].some(
        attr => (attributeScores[attr]?.summaryScore?.value || 0) >= THRESHOLD
      );

      if (isInappropriate) {
        this.setState({ error: "Your comment contains inappropriate content.", loading: false });
        return;
      }

      // Prepare comment object for submission
      const commentData = {
        parentID: parent || 0,
        content: replyText.trim(),
        userID: user.id,
        author: user.name
      };

      // Submit comment
      this.lockInput();
      this.setState({ loading: true, error: false });

      createComment(commentData, response => {
        this.unlockInput();

        if (isNaN(parseInt(response, 10))) {
          this.setState({ error: response, loading: false });
          return;
        }

        this.setState({ loading: false });
        this.clearInput();

        if (typeof updateCfActive === "function") {
          updateCfActive(false);
        }
      });
    })
    .catch(err => {
      console.error("Error with Perspective API:", err);
      this.setState({ error: "Error checking inappropriate content.", loading: false });
    });
}
