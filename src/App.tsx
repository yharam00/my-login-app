import { Box, Button, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import { WithFirebaseApiProps, withFirebaseApi } from './Firebase';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { RootState } from './redux/store';
import { asyncSetUserInfo, asyncUpdateUserInfo, handleUserChange } from './redux/userSlice';

const isLoadingState = (state: RootState): boolean => {
  return state.user.userId === undefined;
};

const OnboardingBase = (props: WithFirebaseApiProps) => {
  const userId = useAppSelector((state: RootState) => state.user.userId);
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  let selectedProfilePic = null;
  if (file !== null) {
    selectedProfilePic = <img src={URL.createObjectURL(file!)} width={200} />;
  }
  return (<>
    <Typography variant="h5" component="div" align="left">
      이름을 입력해주세요
    </Typography>
    <Stack direction="row" spacing={2}>
      <Typography variant="body1" align="left" sx={{ marginTop: "auto", marginBottom: "auto" }}>
        Username:
      </Typography>
      <TextField
        value={username}
        label="Edit Username"
        onChange={(e) => setUsername(e.target.value)}
      />
    </Stack>
    {selectedProfilePic}
    <Button variant="contained" component="label">
      Upload
      <input hidden accept="image/*" onChange={(e) => {
        const files = e.target.files;
        if (files == null || files.length === 0) {
          setFile(null);
        } else {
          setFile(files[0]);
        }
      }} type="file" />
    </Button>
    <Button
      variant="contained"
      sx={{ marginTop: 2 }}
      onClick={async () => {
        const handle = await props.firebaseApi.asyncUploadImage(userId!, file!);
        dispatch(asyncSetUserInfo({
          firebaseApi: props.firebaseApi,
          userId: userId!,
          userInfo: { 
            username: username,
            profilePicHandle: handle,
          },
        }))
      }}
      disabled={file === null || username.length === 0}
    >SUBMIT</Button>
  </>);
}

const Onboarding = withFirebaseApi(OnboardingBase);

const EditProfileBase = (props: WithFirebaseApiProps) => {
  const userId = useAppSelector((state: RootState) => state.user.userId);
  const userInfo = useAppSelector((state: RootState) => state.user.userInfo.value);
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState<string>('');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  useEffect(() => {
    if (userInfo?.profilePicHandle == null) {
      return;
    }
    props.firebaseApi.asyncGetURLFromHandle(userInfo?.profilePicHandle).then((url) => {
      setProfilePicUrl(url);
    });
  }, [userInfo?.profilePicHandle]);
  let profilePic = null;
  if (profilePicUrl) {
    profilePic = <img src={profilePicUrl} width={200} />;
  }
  return (<>
    <Typography variant="h4" component="div" align="left">
      Edit Profile
    </Typography>
    <Stack direction="row" spacing={2}>
      <Typography variant="body1" align="left" sx={{ marginTop: "auto", marginBottom: "auto" }}>
        Username:
      </Typography>
      <TextField
        value={username}
        label="Edit Username"
        onChange={(e) => setUsername(e.target.value)}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <Typography variant="body1" align="left" sx={{ marginTop: "auto", marginBottom: "auto" }}>
        Profile Pic:
      </Typography>
      {profilePic}
    </Stack>
    <Button
      variant="contained"
      sx={{ marginTop: 2 }}
      onClick={async () => {
        dispatch(asyncUpdateUserInfo({
          firebaseApi: props.firebaseApi,
          userId: userId!,
          userInfo: { username: username },
        }))
      }}
    >SUBMIT</Button>
  </>);
}

const EditProfile = withFirebaseApi(EditProfileBase);

const Body = () => {
  const userId = useAppSelector((state: RootState) => state.user.userId);
  const userInfo = useAppSelector((state: RootState) => state.user.userInfo.value);
  const userInfoLoadState = useAppSelector((state: RootState) => state.user.userInfo.loadState);
  if (userId === null) {
    // logged out user
    return (<>
      <Typography>haramy login app을 이용하기 위해 로그인이 필요합니다 🔒</Typography>
    </>);
  }

  if (userInfoLoadState === "loading") {
    return <CircularProgress />;
  }
  if (userInfoLoadState === "failed" || userInfo === undefined) {
    return (<>
      <Typography>Something failed</Typography>
    </>);
  }
  if (userInfo === null) {
    return <Onboarding />;
  }
  return (
    <>
      <Typography whiteSpace={'pre-wrap'}>{`안녕하세요 ${userInfo.username}님 😀 \nharamy login app에 오신걸 환영합니다.`}</Typography>
      <EditProfile />
    </>
  );
};

const App = (props: WithFirebaseApiProps) => {
  const isLoading = useAppSelector(isLoadingState);
  const dispatch = useAppDispatch();

  useEffect(() => {
    return props.firebaseApi.onAuthStateChanged((user) => {
      if (user) {
        dispatch(handleUserChange(props.firebaseApi, user.uid));
      } else {
        dispatch(handleUserChange(props.firebaseApi, null));
      }
    });
  }, []);

  if (isLoading) {
    return <CircularProgress sx={{ margin: "auto" }} />;
  }

  return (
    <>
      <Header />
      <Container sx={{ paddingTop: 3 }}>
        <Box sx={{ margin: "auto" }}>
          <Body />
        </Box>
      </Container>
    </>
  );
}

export default withFirebaseApi(App);
