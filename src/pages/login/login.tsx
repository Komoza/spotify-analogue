import * as S from './login.style';

export const Login = () => {
    return (
        <S.login>
            <S.loginWrap>
                <S.loginLogo src="./src/img/logo-black.png" alt="Логотип" />
                <S.loginName type="text" placeholder="Почта" />
                <S.loginPassword type="text" placeholder="Пароль" />
                <S.loginLogin>Войти</S.loginLogin>
                <S.loginRegistration>Зарегистрироваться</S.loginRegistration>
            </S.loginWrap>
        </S.login>
    );
};
