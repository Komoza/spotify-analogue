import * as S from './not-found.style';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
    return (
        <S.notFound>
            <S.notFoundCode>404</S.notFoundCode>
            <S.notFoundTextWrap>
                <S.notFoundText>Страница не найдена</S.notFoundText>
                <S.notFoundImg
                    src="/src/img/icon/smile_crying.png"
                    alt="грустный смайлик"
                />
            </S.notFoundTextWrap>
            <S.notFoundDescription>
                Возможно, она была удалена или перенесена на другой адрес
            </S.notFoundDescription>
            <Link to="/">
                <S.notFoundButton>Вернуться на главную</S.notFoundButton>
            </Link>
        </S.notFound>
    );
};
