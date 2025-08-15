export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    playlistUrl: process.env.SPOTIFY_PLAYLIST_URL,
    apiUrl: process.env.SPOTIFY_API_URL,
    tokenUrl: process.env.SPOTIFY_TOKEN_URL,
    userInfoUrl: process.env.SPOTIFY_USER_INFO_URL,
    topTrackUrl: process.env.SPOTIFY_TOP_TRACK_URL,
    topArtistUrl: process.env.SPOTIFY_TOP_ARTIST_URL,
  },
  keys: {
    refreshKeyJwt: process.env.REFRESH_KEY_JWT,
    refreshKeySpotify: process.env.REFRESH_KEY_SPOTIFY,
    testId: process.env.TEST_ID,
  },
});
