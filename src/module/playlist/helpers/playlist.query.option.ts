export const playlistBaseInclude = (userId: number) => ({
  _count: { select: { PlaylistLike: true, Comment: true } },
  PlaylistGenres: { select: { genre: { select: { name: true } } } },
  PlaylistLike: { where: { userId }, select: { id: true } },
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      nickname: true,
      profile_url: true,
    },
  },
});
