<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Password Box</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-searchbar
        placeholder="请输入关键字"
        @ion-change="onKeywordChange"
        v-model="keyword"
      ></ion-searchbar>

      <template v-if="userAccounts.length !== 0">
        <van-grid :gutter="10" square style="padding-top: 10px">
          <van-grid-item
            v-for="({ name, password, id }, index) in userAccounts"
            :key="index"
            icon="photo-o"
          >
            <div class="account" @click="copyPassword(id, password)">
              {{ name }}
            </div>
          </van-grid-item>
        </van-grid>
      </template>
      <template v-else>
        <h3 style="text-align: center">暂无数据</h3>
      </template>
      <div class="btn" ref="copy" style="visibility: hidden"></div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  alertController,
  toastController,
  useIonRouter,
} from "@ionic/vue";
import { nanoid } from "nanoid";
import { onMounted, ref } from "vue";
import Fuse from "fuse.js";
import ClipboardJS from "clipboard";
import { useBackButton } from "@ionic/vue";
import { App } from "@capacitor/app";

const ionRouter = useIonRouter();
useBackButton(-1, () => {
  if (!ionRouter.canGoBack()) {
    App.exitApp();
  }
});

useBackButton(10, async processNextHandler => {
  const alert = await alertController.create({
    message: "退出应用?",
    buttons: [
      {
        text: "否",
        role: "cancel",
      },
      {
        text: "是",
        role: "confirm",
        handler() {
          processNextHandler();
        },
      },
    ],
  });

  await alert.present();
});

const userAccounts = ref<
  {
    id: string;
    name: string;
    account: string;
    password: string;
    keywords: string[];
  }[]
>([]);

let fuse: any;
let accountsWithId: any;
onMounted(async () => {
  const accounts = await fetch(
    "https://admirable-banoffee-39be22.netlify.app/.netlify/functions/account"
  )
    .then(
      resp => resp.json(),
      e => console.log(e)
    )
    .then(res => {
      accountsWithId = res.map((account: any) => ({
        ...account,
        id: nanoid(),
      }));
      userAccounts.value = accountsWithId;
      const options = {
        keys: ["name", "keywords"],
      };

      fuse = new Fuse(userAccounts.value, options);
    });
});

const keyword = ref("");

const onKeywordChange = () => {
  if (keyword.value === "") {
    userAccounts.value = accountsWithId;
    return;
  }
  const result = fuse.search(keyword.value);
  if (result.length) {
    userAccounts.value = result.map((r: any) => r.item);
  } else {
    userAccounts.value = [];
  }
};

const copy = ref();

const currentId = ref("");
const copyPassword = (id: string, password: string) => {
  copyText(password);
  currentId.value = id;
};

const copyText = async (text: string) => {
  new ClipboardJS(".btn", {
    text: function () {
      return text;
    },
  });

  copy.value.click();
  await presentAlert();
};

const presentAlert = async () => {
  const alert = await alertController.create({
    header: "操作成功!",
    message: "密码已复制, 账号信息请点击按钮复制",
    buttons: [
      {
        text: "关闭",
        role: "cancel",
      },
      {
        text: "复制账号",
        role: "confirm",
        async handler() {
          new ClipboardJS(".btn", {
            text: function () {
              return (
                userAccounts.value.find((ua: any) => ua.id === currentId.value)
                  ?.account || ""
              );
            },
          });

          copy.value.click();
          const toast = await toastController.create({
            message: "账号复制成功!",
            duration: 1500,
            position: "top",
          });

          await toast.present();
        },
      },
    ],
  });

  await alert.present();
};
</script>

<style scoped lang="scss">
.account {
  text-align: center;
  /*第一步： 溢出隐藏 */
  overflow: hidden;
  /* 第二步：让文本不会换行， 在同一行继续 */
  white-space: nowrap;
  /* 第三步：用省略号来代表未显示完的文本 */
  text-overflow: ellipsis;
  width: 100%;
}
</style>
