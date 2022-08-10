const detectGithubPulls = (text) => {
    const regex = /https:\/\/github.com\/sreekanth-sreekumar\/([a-zA-Z]+-[a-zA-Z]+)\/pull\/(\d+)/g;
    return text.match(regex)
}

module.exports = {
    detectGithubPulls
}