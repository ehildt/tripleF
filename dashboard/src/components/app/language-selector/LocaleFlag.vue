<script setup lang="ts">
import al from 'flag-icons/flags/4x3/al.svg';
import az from 'flag-icons/flags/4x3/az.svg';
import ba from 'flag-icons/flags/4x3/ba.svg';
import bd from 'flag-icons/flags/4x3/bd.svg';
import bg from 'flag-icons/flags/4x3/bg.svg';
import by from 'flag-icons/flags/4x3/by.svg';
import cn from 'flag-icons/flags/4x3/cn.svg';
import cz from 'flag-icons/flags/4x3/cz.svg';
import de from 'flag-icons/flags/4x3/de.svg';
import dk from 'flag-icons/flags/4x3/dk.svg';
import ee from 'flag-icons/flags/4x3/ee.svg';
import es from 'flag-icons/flags/4x3/es.svg';
import et from 'flag-icons/flags/4x3/et.svg';
import fi from 'flag-icons/flags/4x3/fi.svg';
import fr from 'flag-icons/flags/4x3/fr.svg';
import gb_sct from 'flag-icons/flags/4x3/gb-sct.svg';
import gb_wls from 'flag-icons/flags/4x3/gb-wls.svg';
import gr from 'flag-icons/flags/4x3/gr.svg';
import hr from 'flag-icons/flags/4x3/hr.svg';
import hu from 'flag-icons/flags/4x3/hu.svg';
import id from 'flag-icons/flags/4x3/id.svg';
import ie from 'flag-icons/flags/4x3/ie.svg';
import il from 'flag-icons/flags/4x3/il.svg';
import inFlag from 'flag-icons/flags/4x3/in.svg';
import ir from 'flag-icons/flags/4x3/ir.svg';
import is from 'flag-icons/flags/4x3/is.svg';
import it from 'flag-icons/flags/4x3/it.svg';
import jp from 'flag-icons/flags/4x3/jp.svg';
import ke from 'flag-icons/flags/4x3/ke.svg';
import kh from 'flag-icons/flags/4x3/kh.svg';
import kr from 'flag-icons/flags/4x3/kr.svg';
import kz from 'flag-icons/flags/4x3/kz.svg';
import lk from 'flag-icons/flags/4x3/lk.svg';
import lt from 'flag-icons/flags/4x3/lt.svg';
import lu from 'flag-icons/flags/4x3/lu.svg';
import lv from 'flag-icons/flags/4x3/lv.svg';
import mk from 'flag-icons/flags/4x3/mk.svg';
import mm from 'flag-icons/flags/4x3/mm.svg';
import mt from 'flag-icons/flags/4x3/mt.svg';
import my from 'flag-icons/flags/4x3/my.svg';
import ng from 'flag-icons/flags/4x3/ng.svg';
import nl from 'flag-icons/flags/4x3/nl.svg';
import no from 'flag-icons/flags/4x3/no.svg';
import np from 'flag-icons/flags/4x3/np.svg';
import ph from 'flag-icons/flags/4x3/ph.svg';
import pk from 'flag-icons/flags/4x3/pk.svg';
import pl from 'flag-icons/flags/4x3/pl.svg';
import pt from 'flag-icons/flags/4x3/pt.svg';
import ro from 'flag-icons/flags/4x3/ro.svg';
import rs from 'flag-icons/flags/4x3/rs.svg';
import ru from 'flag-icons/flags/4x3/ru.svg';
import sa from 'flag-icons/flags/4x3/sa.svg';
import se from 'flag-icons/flags/4x3/se.svg';
import si from 'flag-icons/flags/4x3/si.svg';
import sk from 'flag-icons/flags/4x3/sk.svg';
import th from 'flag-icons/flags/4x3/th.svg';
import tr from 'flag-icons/flags/4x3/tr.svg';
import ua from 'flag-icons/flags/4x3/ua.svg';
import us from 'flag-icons/flags/4x3/us.svg';
import uz from 'flag-icons/flags/4x3/uz.svg';
import vn from 'flag-icons/flags/4x3/vn.svg';
import za from 'flag-icons/flags/4x3/za.svg';

/** Country code (ISO 3166-1-alpha-2, or a regional variant like `gb-sct`) → flag SVG. */
const FLAGS: Record<string, string> = {
  al,
  az,
  ba,
  bd,
  bg,
  by,
  cn,
  cz,
  de,
  dk,
  ee,
  es,
  et,
  fi,
  fr,
  'gb-sct': gb_sct,
  'gb-wls': gb_wls,
  gr,
  hr,
  hu,
  id,
  ie,
  il,
  in: inFlag,
  ir,
  is,
  it,
  jp,
  ke,
  kh,
  kr,
  kz,
  lk,
  lt,
  lu,
  lv,
  mk,
  mm,
  mt,
  my,
  ng,
  nl,
  no,
  np,
  ph,
  pk,
  pl,
  pt,
  ro,
  rs,
  ru,
  sa,
  se,
  si,
  sk,
  th,
  tr,
  ua,
  us,
  uz,
  vn,
  za,
};

defineProps<{ country: string }>();
</script>

<template>
  <img
    class="locale-flag"
    :src="FLAGS[country]"
    alt=""
    aria-hidden="true"
    loading="lazy"
  />
</template>

<style scoped>
.locale-flag {
  flex-shrink: 0;
  width: 1.25rem;
  height: 0.9375rem; /* 4:3 */
  object-fit: cover;
  border-radius: 2px;
}
</style>
