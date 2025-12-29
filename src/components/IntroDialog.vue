<script setup lang="ts">
import { store } from "../store";

defineProps<{ isLoading: boolean }>();
const emits = defineEmits(["close"]);

const showColofon = () => {
  store.commit("setColofonDialogVisible", true);
};
</script>

<template>
  <teleport to="body">
    <div @click="$emit('close')"></div>
    <dialog open class="w-full sm:w-[50%] left-0 right-0 mx-auto z-30">
      <img
        src="https://hetutrechtsarchief.nl/images/1.Afbeeldingen/2018/Onderzoek/Wo_II.jpg"
      />

      <section>
        <h1 class="text-lg mb-2 sm:text-5xl sm:mb-8 sm:leading-[3.5rem]">
          Tweede wereldoorlog op de kaart
        </h1>
        <p class="text-sm sm:text-lg">
          Zoekt u naar een persoon die in Utrecht leefde tijdens de
          oorlogsjaren? Bent u benieuwd wat tijdens de Tweede Wereldoorlog is
          gebeurd op uw adres, in uw buurt of in uw omgeving? Via deze WO2 kaart
          kunt u zoeken in zo'n 5.500 adressen en 19.000 documenten.
        </p>
        <p class="text-sm sm:text-lg mt-5">
          Meer informatie over dit project en belangrijke tips over hoe de
          gegevens te interpreteren vindt u in onze
          <button @click="showColofon()"><u>Colofon</u>.</button>
        </p>
      </section>

      <button
        v-if="isLoading"
        disabled
        class="bg-white hover:bg-[#dddddd] transition-colors p-4 font-bold"
      >
        De gegevens worden geladen...
      </button>

      <button
        v-if="!isLoading"
        class="bg-white hover:bg-[#dddddd] transition-colors p-4 font-bold"
        @click="$emit('close')"
      >
        Naar de kaart!
      </button>
    </dialog>
  </teleport>
</template>

<style scoped>
img {
  position: absolute;
  left: -120px;
  top: -80px;
  width: 600px;
  z-index: -1000;
  /*margin-left: -100px;*/
}

dialog {
  position: fixed;
  top: 20vh;
  /*left: 10%;*/
  /*width: 80%;*/
  background: transparent;

  /*border-radius: 12px;*/
  /*background: rgba(67, 127, 116, 0.9);*/
  /* border: 1px solid red; */
  /*margin: 0;*/
  /*overflow: hidden;*/
}

h1 {
  color: white;
  /*font-family: "Akzidenz-Grotesk Next";*/
  font-style: normal;
  font-weight: bold;
  /*font-size: 45px;*/
  /*line-height: 52px;*/
  /*margin-bottom: 40px;*/
}

div {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100%;
  /* border: 1px solid yellow; */
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 10;
}

p {
  font-style: normal;
  font-weight: 400;
  color: white;
  /*font-size: 20px;*/
  /*line-height: 32px;*/
}

section {
  max-width: 516px;
  /* width: 516px;
                                                                                                                                                                                  height: 470px; */
  /*border: 1px solid red;*/
  background: rgba(67, 127, 116, 0.9);
}

dialog section {
  padding: 2rem;
}

header {
  background-color: silver;
  color: white;
  width: 100%;
  padding: 1rem;
}

header h2 {
  margin: 0;
}

section {
  padding: 1rem;
}

menu {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  margin: 0;
}
</style>
