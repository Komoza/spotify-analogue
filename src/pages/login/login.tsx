import * as S from './login.style';
import { saveUserToLocalStorage } from '../../helper';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { getAccessToken, loginAPI } from '../../api';
import { AccessToken, User } from '../../cosntant';
import { useDispatch } from 'react-redux';
import { currentPage, user } from '../../store/actions/creators/creators';

export const Login = () => {
    const dispatch = useDispatch();
    
    const mailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [connectToServer, setConnectToServer] = useState<boolean>(false);

    const navigate = useNavigate();

    const validateAndLogin = async () => {
        setConnectToServer(true);

        try {
            let email = '';
            let password = '';

            if (mailRef.current && passwordRef.current) {
                email = mailRef.current.value;
                password = passwordRef.current.value;
            }

            const userData: User = (await loginAPI(email, password)) as User;
            const accessToken: AccessToken = (await getAccessToken(
                email,
                password
            )) as AccessToken;

            userData.accessToken = accessToken;
            dispatch(user(userData));
            saveUserToLocalStorage(userData);
            setErrorMessage(null);
            navigate('/', { replace: true });
            dispatch(currentPage('/'))
        } catch (error: unknown) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
        } finally {
            setConnectToServer(false);
        }
    };

    const handleClickLogin = () => {
        if (!mailRef.current?.value) {
            setErrorMessage('Заполните почту');
            return;
        }
        if (!passwordRef.current?.value) {
            setErrorMessage('Введите пароль');
            return;
        }

        void validateAndLogin();
    };

    return (
        <S.login>
            <S.loginWrap>
                <S.loginLogo src="./src/img/logo-black.png" alt="Логотип" />
                <S.loginName ref={mailRef} type="text" placeholder="Почта" />
                <S.loginPassword
                    ref={passwordRef}
                    type="password"
                    placeholder="Пароль"
                />
                {errorMessage && (
                    <S.errorMessage>{errorMessage}</S.errorMessage>
                )}
                {connectToServer ? (
                    <S.loginLoginLoad>Загрузка...</S.loginLoginLoad>
                ) : (
                    <S.loginLogin onClick={handleClickLogin}>
                        Войти
                    </S.loginLogin>
                )}
                <S.registrationLink to="/registration">
                    <S.loginRegistration>
                        Зарегистрироваться
                    </S.loginRegistration>
                </S.registrationLink>
            </S.loginWrap>
        </S.login>
    );
};
