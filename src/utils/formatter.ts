// 플레이리스트 포맷
export const formatPlaylist = (result: any) => {
  return {
    userId: result.user.id,
    userName: result.user.name,
    userNickname: result.user.nickname,
    userProfileUrl: result.user.profile_url,
    postId: result.id,
    playlistId: result.playlistId,
    playlistName: result.name,
    imageUrl: result.imageUrl,
    likeCount: result._count.PlaylistLike,
    commentCount: result._count.Comment,
    genre: result.PlaylistGenres.map((data) => data.genre.name),
    isLiked: !!result.PlaylistLike[0],
    viewCount: result.viewCount,
    createdAt: result.createdAt,
  };
};

// 댓글 포맷(플레이리스트)
export const formatComment = (result: any) => {
  return {
    commentId: result.id,
    postId: result.postId,
    userId: result.userId,
    userName: result.user.name,
    userNickname: result.user.nickname,
    userProfileUrl: result.user.profile_url,
    content: result.content,
    createdAt: result.createdAt,
    likeCount: result._count.likes,
    isLiked: !!result.likes[0],
  };
};
