/* eslint-disable */
let authError;

const database = {
  signUp: (regEmail, regPassword, firebasePipo=null) => {
    (firebasePipo? firebasePipo: firebase).auth().createUserWithEmailAndPassword(regEmail, regPassword)
      .catch((error) => {
        authError = error;
        return authError;
      });
  },
  signIn: () => {
    const logEmail = document.getElementById('logEmail').value;
    const logPassword = document.getElementById('logPassword').value;
    firebase.auth().signInWithEmailAndPassword(logEmail, logPassword)
      .catch((error) => {
        authError = error;
        return authError;
      });
  },
  errorInfo: () => {
    const errorMsg = authError;
    return errorMsg;
  },
  signInGoogle: () => {
    firebase.auth().signInWithPopup(providerGoogle)
      .then((result) => {
        const user = result.user;
        console.log(user);
      }).catch((error) => {
        throw error('¡Error!');
      });
  },
  signInFacebook: () => {
    firebase.auth().signInWithPopup(providerFb).then((result) => {
      const token = result.credential.accessToken;
      console.log(token);
      const user = result.user;
      console.log(user);
    }).catch((error) => {
      throw error('¡Error!');
    });
  },
  getPostFeed: async () => { 
    imageRefPost.on('value', async (snapshot) => {
      const data = snapshot.val();
      let result = '';
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const timeStamp = data[key].postTime;
          const normalDate = new Date(timeStamp);
          const dateFormat = normalDate.toLocaleString();
          const userId = data[key].uid;
          let userName = 'default';
          let photoUser = '';
          const usersRef = firebase.database().ref('users');
          await usersRef.child(userId).once('value', async (snapshots) => {
            userName = snapshots.val();
            const imageUser = firebase.database().ref('image');
            await imageUser.child(userId).once('value', (snap) => {
              photoUser = snap.val();
            });
            result += `
              <div class="userInfo media">
                <div class="image is-48x48">
                  <img src=${photoUser.url} class="is-rounded"/>
                </div>
                <div class="media-content">
                  <p>${'@'}${userName.userName}</p>
                </div>
              </div>
              <div class="file is-centered">
                <img src='${data[key].url}'/>
              </div>
              <div>
                <img id="like" width="5%" height="5%" src="https://i.ibb.co/Kqxbg7Y/smile-rgb.png"/>
                <img id="dislike" width="5%" height="5%" src="https://i.ibb.co/0GdLWZ6/kk-rgb.png"/>
                <img id="commentPost" width="5%" height="5%" src="https://i.ibb.co/c20jsVj/coment-rgb.png"/>
                <p>${data[key].comment}</p>
                <p>${dateFormat}</p>
              </div>
              </br>
            `;
            document.getElementById('postFeed').innerHTML = result;
          });
        }
      }
    })
  }, 
  userObserver: (renderFeed) => { 
    firebase.auth().onAuthStateChanged((user) => { 
      if (user) {
        console.log('existe usuario activo');
        renderFeed();
        console.log('*****************');
        console.log(user.emailVerified);
        console.log('*****************');
      } else {
        console.log('no existe usuario activo');
      }
    });
  },
  getProfilePic: () => {
    const uid = firebase.auth().currentUser.uid;
    return firebase.firestore().collection('image').doc(uid).get()
      .then(doc => doc.data());
  },
  getProfileName: () => {
    const uid = firebase.auth().currentUser.uid;
    return firebase.firestore().collection('users').doc(uid).get()
      .then(doc => doc.data());
  },
  getPostPic: () => {
    imageRefPost.on('value', (snapshot) => {
      const data = snapshot.val();
      let result = '';
      for (const key in data) {
        result = `<img width='500px' src= ${data[key].url}/>`;
      }
      document.getElementById('showNewImg').innerHTML = result;
    });
  },
  uploadPicture: (file) => {
    const uploadTask = storage.child(`profilePictures/${file.name}`).put(file);
    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log(`Upload is ${progress}% done`);
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED:
          console.log('Upload is paused');
          break;
        case firebase.storage.TaskState.RUNNING:
          console.log('Upload is running');
          break;
        default:
      }
    
    }, (error) => {
      console.error(error);
    },
    () => {
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        console.log('File available at', downloadURL);
        database.createNodeFirebase(file.name, downloadURL);
        database.getProfilePic();
      });
    });
  },
  uploadPicturePost: (file) => {
    const uploadImg = document.getElementById('uploadImg').files[0];
    const uploadTask = storage.child(`postImage/${uploadImg.name}`).put(uploadImg);
    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log(`Upload is ${progress}% done`);
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED:
          console.log('Upload is paused');
          break;
        case firebase.storage.TaskState.RUNNING:
          console.log('Upload is running');
          break;
        default:
      }
    }, (error) => {
    }, () => {
      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        console.log('File available at', downloadURL);
        database.createNodeFirebaseForPost(uploadImg.name, downloadURL);
        database.getPostPic();
      });
    });
  },
  createNodeFirebase: (nameImage, url) => {
    const userPhotoProf = { name: nameImage, url, uid: firebase.auth().currentUser.uid };
    console.log(userPhotoProf);
    firebase.database().ref(`image/${userPhotoProf.uid}`).set(userPhotoProf);
    db.collection('image').doc(firebase.auth().currentUser.uid).set({
      name: nameImage,
      url,
      uid: firebase.auth().currentUser.uid,
    });
  },
  createNodeFirebaseForPost: (nameImage, url) => {
    const postMessage = document.getElementById('postMessage').value;
    const userImgePost = {
      name: nameImage, url, uid: firebase.auth().currentUser.uid, postTime: firebase.database.ServerValue.TIMESTAMP, comment: postMessage,
    };
    firebase.database().ref('post-image')
      .push(userImgePost);
    db.collection('post-image').add({
      name: nameImage,
      url,
      uid: firebase.auth().currentUser.uid,
      postTime: new Date(),
      comment: postMessage,
    });
  },
  saveData: (user) => {
    const userName = document.getElementById('userName').value;
    const profileName = document.getElementById('profileName').value;
    const biography = document.getElementById('biography').value;
    const userInfo = {
      userName, profileName, biography, uid: firebase.auth().currentUser.uid,
    };
    firebase.database().ref(`users/${userInfo.uid}`).set(userInfo);
    db.collection('users').doc(firebase.auth().currentUser.uid).set({
      uid: firebase.auth().currentUser.uid,
      userName,
      profileName,
      biography,
    });
  },
  logout: () => {
    firebase.auth().signOut().then(() => {
      console.log('Saliendo...');
    }).catch((error) => {
      console.log(error);
    });
  },
};
export default database;
