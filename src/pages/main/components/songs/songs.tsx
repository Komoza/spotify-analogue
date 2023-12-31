import * as S from './songs.style';
import {
    CustomError,
    Track,
    UpdateToken,
    User,
    formatTime,
    sortByDate,
} from '../../../../cosntant';
import { RootState } from '../../../../store/actions/types/types';
import { useSelector, useDispatch } from 'react-redux';
import {
    setActivePlaylist,
    setCurrentTrack,
    setDisplayPlaylist,
    setIsPlay,
    setOriginPlaylist,
    setVirtualPlaylist,
    user,
} from '../../../../store/actions/creators/creators';
import { RefObject, useEffect, useRef } from 'react';
import {
    getRefreshUserTokenFromLocalStorage,
    getUserFromLocalStorage,
    removeUserFromLocalStorage,
    saveUserToLocalStorage,
} from '../../../../helper';

import {
    useAddTrackToFavoriteMutation,
    useDeleteTrackFromFavoriteMutation,
    useGetAllTracksQuery,
} from '../../../../services/tracks';
import { getNewAccessToken } from '../../../../api';

interface PlaylistProps {
    refPlaylist: RefObject<HTMLDivElement>;
}

const Playlist: React.FC<PlaylistProps> = ({ refPlaylist }) => {
    const dispatch = useDispatch();
    const activePlaylist = useSelector(
        (state: RootState) => state.otherState.activePlaylist
    );
    const filtersState = useSelector(
        (state: RootState) => state.otherState.filters
    );
    const originPlaylist = useSelector(
        (state: RootState) => state.otherState.originPlaylist
    );
    const displayPlaylist = useSelector(
        (state: RootState) => state.otherState.displayPlaylist
    );

    const [addTrackToFavorite, { error: errorLike }] =
        useAddTrackToFavoriteMutation();
    const [deleteTrackFromFavorite, { error: errorDislike }] =
        useDeleteTrackFromFavoriteMutation();

    // Обработка 401 ошибки
    useEffect(() => {
        const errorStateDislike: CustomError = errorDislike as CustomError;
        const errorStateLike: CustomError = errorLike as CustomError;

        if (
            errorStateDislike?.status === 401 ||
            errorStateLike?.status === 401
        ) {
            const fetchUpdateToken = async () => {
                alert('обновление токена');
                const userData = getUserFromLocalStorage() as User;
                try {
                    const newToken: UpdateToken = await getNewAccessToken(
                        getRefreshUserTokenFromLocalStorage()
                    );
                    const newUser: User = {
                        ...userData,
                        accessToken: {
                            access: newToken.access,
                            refresh: userData.accessToken.refresh,
                        },
                    };
                    saveUserToLocalStorage(newUser);

                    location.reload();
                } catch {
                    dispatch(user(null));
                    removeUserFromLocalStorage();
                }
            };

            void fetchUpdateToken();
        }
    }, [dispatch, errorDislike, errorLike]);

    // Эффект при изменении фильтров
    useEffect(() => {
        if (displayPlaylist) {
            let newDisplayPlaylist: Track[] = [...originPlaylist];

            // сортировка
            if (filtersState.years === 'Сначала новые') {
                newDisplayPlaylist.sort((a, b) =>
                    sortByDate(b.release_date, a.release_date)
                );
            } else if (filtersState.years === 'Сначала старые') {
                newDisplayPlaylist.sort((a, b) =>
                    sortByDate(a.release_date, b.release_date)
                );
            }

            // отбор по авторам и жанрам
            if (filtersState.author.length || filtersState.genre.length) {
                if (filtersState.author.length && filtersState.genre.length) {
                    newDisplayPlaylist = [
                        ...newDisplayPlaylist.filter((track) =>
                            filtersState.author.includes(track.author)
                        ),
                    ];
                    newDisplayPlaylist = [
                        ...newDisplayPlaylist.filter((track) =>
                            filtersState.genre.includes(track.genre)
                        ),
                    ];
                } else if (filtersState.author.length) {
                    newDisplayPlaylist = [
                        ...newDisplayPlaylist.filter((track) =>
                            filtersState.author.includes(track.author)
                        ),
                    ];
                } else if (filtersState.genre.length) {
                    newDisplayPlaylist = [
                        ...newDisplayPlaylist.filter((track) =>
                            filtersState.genre.includes(track.genre)
                        ),
                    ];
                }
            }

            // отбор фильтр пополю в поиске
            if (filtersState.searchWords.length) {
                newDisplayPlaylist = [
                    ...newDisplayPlaylist.filter((track) =>
                        track.name
                            .toLowerCase()
                            .includes(filtersState.searchWords.toLowerCase())
                    ),
                ];
            }

            dispatch(setDisplayPlaylist(newDisplayPlaylist));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtersState, originPlaylist]);

    const currentTrack = useSelector(
        (state: RootState) => state.otherState.currentTrack
    );
    const virtualPlaylist = useSelector(
        (state: RootState) => state.otherState.virtualPlaylist
    );
    const userState = useSelector((state: RootState) => state.otherState.user);
    const currentTrackID = currentTrack ? currentTrack.id : null;
    const currentTrackRef = useRef<HTMLDivElement>(null);

    const isPlay: boolean = useSelector(
        (state: RootState) => state.otherState.isPlay
    );

    const handleClickTrack = (track: Track) => {
        // Смена активного плейлиста
        if (activePlaylist !== displayPlaylist) {
            dispatch(setActivePlaylist(displayPlaylist));
        }
        if (currentTrack !== track) {
            dispatch(setIsPlay(true));
            dispatch(setCurrentTrack(track));

            // добавляем трек в виртуальный плейлист
            const newVirtualPlaylist: Track[] = [...virtualPlaylist];

            // проверяем есть ли этот трек в виртуальном массиве, если есть удалим
            const indexFindTrack = newVirtualPlaylist.indexOf(track);
            if (indexFindTrack !== -1) {
                newVirtualPlaylist.splice(indexFindTrack, 1);
            }

            newVirtualPlaylist.push(track);

            dispatch(setVirtualPlaylist(newVirtualPlaylist));
        } else {
            dispatch(setIsPlay(!isPlay));
        }
    };

    const handleClickLike = (
        event: React.MouseEvent<SVGSVGElement, MouseEvent>,
        id: number
    ) => {
        event.stopPropagation();
        void addTrackToFavorite(id);
    };
    const handleClickDislike = (
        event: React.MouseEvent<SVGSVGElement, MouseEvent>,
        id: number
    ) => {
        event.stopPropagation();
        void deleteTrackFromFavorite(id);
    };

    // прокрутка страницы к треку
    useEffect(() => {
        if (currentTrackRef.current && refPlaylist.current) {
            const trackTop = currentTrackRef.current.offsetTop;
            const trackBottom = trackTop + currentTrackRef.current.offsetHeight;
            const areaTop = refPlaylist.current.scrollTop;
            const areaBottom = areaTop + refPlaylist.current.offsetHeight;

            if (trackTop < areaTop || trackBottom > areaBottom) {
                refPlaylist.current.scrollTo({
                    top: trackTop - refPlaylist.current.offsetHeight,
                    behavior: 'smooth',
                });
            }
        }
    }, [currentTrack, refPlaylist]);

    if (displayPlaylist) {
        if (!displayPlaylist.length) {
            return <S.errorGetSongs>Список треков пуст</S.errorGetSongs>;
        }
        return displayPlaylist.map((song) => {
            return (
                <S.playlistItem key={song.id}>
                    <S.track
                        ref={
                            currentTrackID === song.id ? currentTrackRef : null
                        }
                        onClick={() => handleClickTrack(song)}
                    >
                        <S.trackTitle>
                            <S.trackTitleImage>
                                {currentTrackID == song.id && (
                                    <S.trackTitleImageActive
                                        $isPlay={isPlay}
                                    ></S.trackTitleImageActive>
                                )}
                                <S.trackTitleSvg aria-label="music">
                                    <use
                                        xlinkHref={
                                            song.logo
                                                ? song.logo
                                                : './src/img/icon/sprite.svg#icon-note'
                                        }
                                    ></use>
                                </S.trackTitleSvg>
                            </S.trackTitleImage>
                            <S.trackTitleText>
                                <S.trackTitleLink>
                                    {song.name}
                                    <S.trackTitleSpan>
                                        {/* &nbsp;{song.description} */}
                                    </S.trackTitleSpan>
                                </S.trackTitleLink>
                            </S.trackTitleText>
                        </S.trackTitle>

                        <S.trackAuthor>
                            <S.trackAuthorLink>{song.author}</S.trackAuthorLink>
                        </S.trackAuthor>

                        <S.trackAlbum>
                            <S.trackAlbumLink>{song.album}</S.trackAlbumLink>
                        </S.trackAlbum>

                        <S.trackTime>
                            {song.stared_user?.some(
                                (user) => user.id === userState?.id
                            ) ? (
                                <S.trackTimeSvgLike
                                    onClick={(event) =>
                                        handleClickDislike(event, song.id)
                                    }
                                    aria-label="time"
                                >
                                    <use xlinkHref="./src/img/icon/sprite.svg#icon-like"></use>
                                </S.trackTimeSvgLike>
                            ) : (
                                <S.trackTimeSvg
                                    onClick={(event) =>
                                        handleClickLike(event, song.id)
                                    }
                                    aria-label="time"
                                >
                                    <use xlinkHref="./src/img/icon/sprite.svg#icon-like"></use>
                                </S.trackTimeSvg>
                            )}
                            <S.trackTimeText>
                                {formatTime(song.duration_in_seconds)}
                            </S.trackTimeText>
                        </S.trackTime>
                    </S.track>
                </S.playlistItem>
            );
        });
    }
};

export const PlaylistSkeleton = () => {
    const playlistSkeleton = [];
    for (let i = 0; i < 10; i++) {
        playlistSkeleton.push(
            <S.playlistItem key={i}>
                <S.track>
                    <S.trackTitle>
                        <S.trackTitleImageLoading></S.trackTitleImageLoading>
                        <S.trackTitleTextLoading></S.trackTitleTextLoading>
                    </S.trackTitle>
                    <S.trackAuthorLoading></S.trackAuthorLoading>
                    <S.trackAlbumLoading></S.trackAlbumLoading>
                </S.track>
            </S.playlistItem>
        );
    }

    return playlistSkeleton;
};

export const Songs = () => {
    const { data, error, isLoading: isLoadingApp } = useGetAllTracksQuery();
    const dispatch = useDispatch();
    const refPlaylist = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (data) {
            dispatch(setDisplayPlaylist([...data]));
            dispatch(setOriginPlaylist([...data]));
        }
    }, [data, dispatch]);

    return (
        <S.centerblockContent>
            <S.playlistTitle>
                <S.playlistTitleCol01>Трек</S.playlistTitleCol01>
                <S.playlistTitleCol02>ИСПОЛНИТЕЛЬ</S.playlistTitleCol02>
                <S.playlistTitleCol03>АЛЬБОМ</S.playlistTitleCol03>
                <S.playlistTitleCol04>
                    <S.playlistTitleSvg aria-label="time">
                        <use xlinkHref="./src/img/icon/sprite.svg#icon-watch"></use>
                    </S.playlistTitleSvg>
                </S.playlistTitleCol04>
            </S.playlistTitle>
            <S.playlist ref={refPlaylist}>
                {!isLoadingApp && data ? (
                    <Playlist refPlaylist={refPlaylist} />
                ) : (
                    <PlaylistSkeleton />
                )}
                {error && (
                    <S.errorGetSongs>
                        Не удалось загрузить песни...
                    </S.errorGetSongs>
                )}
            </S.playlist>
        </S.centerblockContent>
    );
};
