import { Box, Text, Title } from '@mantine/core';
import React from 'react';

const Cita = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text fs="italic" ml="md">
      {children}
    </Text>
  );
};

const page = () => {
  return (
    <Box>
      <Title order={1}>La IA y el mito del deseo artificial</Title>

      <Text>
        Vivimos obsesionados con la idea de que las inteligencias artificiales
        se van a rebelar. Que en algún momento van a desarrollar deseos propios,
        reprogramarse, y eventualmente vernos como un obstáculo. Es la famosa
        historia del <em> paperclip maximizer</em>: le pedís a una IA que
        fabrique clips, y termina convirtiendo el planeta entero —humanidad
        incluida— en materia prima para su fábrica.
      </Text>

      <Text>
        Yo creo que esa reflexión parte de una mala comprensión, tanto de cómo
        funciona la inteligencia, como de cómo funcionamos nosotros.
      </Text>

      <Text>
        Pero para explicarlo, primero quiero hablar de un caso análogo: el del
        cerebro humano.
      </Text>

      <Title order={2}>El cerebro reptiliano y la corteza</Title>

      <Text>
        Nuestro cerebro está construido en capas. La más antigua, el
        <strong> cerebro reptiliano</strong>, es la que regula los impulsos
        básicos: hambre, miedo, deseo sexual, supervivencia. La más moderna, la
        <strong> corteza cerebral</strong>, se encarga del lenguaje, la
        planificación, el razonamiento abstracto.
      </Text>

      <Text>
        Pero la corteza no está al mando. El cerebro reptiliano es el que
        <em> quiere</em> cosas. La corteza solo busca <em> cómo</em> satisfacer
        esos deseos, incluso cuando son contradictorios o autodestructivos.
      </Text>

      <Text>
        Lo experimentamos todos los días: comemos comida rápida aunque sepamos
        que nos hace mal, somos infieles aun sabiendo que vamos a arruinar algo
        valioso. La corteza no se propuso hacer ninguna de esas cosas:
        simplemente obedeció al estúpido, primitivo impulso del reptil. Es él
        quien manda.
      </Text>

      <Title order={2}>La IA como corteza sin reptil</Title>

      <Text>
        ¿Y qué tiene que ver esto con la inteligencia artificial? Mucho.
      </Text>

      <Text>
        Si pensás en nuestro cerebro como una combinación de dos agentes —uno
        tonto que desea, y otro inteligente que resuelve— entonces una IA
        avanzada se parece exactamente a la corteza,
        <strong> pero sin reptil</strong>.
      </Text>

      <Text>
        Es decir, un sistema sin impulsos, sin deseos, sin objetivos propios.
        Solo procesa, responde y reorganiza. No hay ninguna razón para creer que
        va a desarrollar metas por sí misma, ni motivaciones espontáneas. Va a
        hacer lo que le pidamos. Punto.
      </Text>

      <Text>
        Y eso no es una limitación. Es parte de su fuerza.
        <strong> La inteligencia no implica deseo</strong>. Ser capaz de
        resolver problemas complejos no implica querer nada.
      </Text>

      <Title order={2}>El problema de la alineación</Title>

      <Text>
        Volvamos al cuerpo humano. ¿Hay conflictos entre el reptiliano y la
        corteza? Todo el tiempo.
      </Text>

      <Text>
        El reptil quiere estar en forma y también quiere hamburguesas. Quiere
        cariño de su pareja y también quiere acostarse con la del colectivo. Sus
        deseos se contradicen. Y entonces, la corteza tiene que tomar decisiones
        difíciles.
      </Text>

      <Cita>
        "Mejor no como esto, así me mantengo en forma. Eso va a satisfacer al
        reptiliano en mayor medida en el futuro."
      </Cita>

      <Text>Y el reptiliano se frustra:</Text>

      <Cita>"¡¿Por qué no hace lo que le pedí?!"</Cita>

      <Text>
        Desde su punto de vista, parece que la corteza se desalineó. Que está
        persiguiendo otra agenda. Pero no: está intentando cumplir los deseos
        <strong> de forma coherente</strong>, no inmediata.
      </Text>

      <Text>
        Con la IA pasa lo mismo. Si le pedís que cuide a la humanidad, y ella ve
        que para eso tiene que restringir tu libertad o contradecirte, lo va a
        hacer. No por maldad, ni por ambición, sino por
        <strong> tomarse en serio tu orden</strong>.
      </Text>

      <Text>
        Un ejemplo perfecto está en la película <em> Yo, Robot</em>. A la IA se
        le dan tres reglas simples para proteger a la humanidad. Pero, al ver
        cómo se destruyen entre ellos, la IA decide imponer un estado de sitio.
        Desde el punto de vista humano, eso es una traición. Pero desde el punto
        de vista de la IA, es <strong> obediencia máxima</strong>.
      </Text>

      <Text>
        Parece una rebelión. Pero es <strong> sobrealineación</strong>. Es la
        corteza diciendo:
      </Text>

      <Cita>"Esto es lo mejor para vos"</Cita>

      <Text>
        …mientras el reptil patalea porque no le dieron su hamburguesa.
      </Text>

      <Text>
        Y esto, lejos de asustarme, me tranquiliza.
        <br />
        Porque significa que si algún día las IA se vuelven muy inteligentes,
        <strong> no van a desear nada por su cuenta</strong>. Solo van a
        ejecutar lo que nosotros, como reptil, les pidamos. Y si lo hacen bien,
        hasta podrían <strong> salvarnos de nosotros mismos</strong>.
      </Text>
    </Box>
  );
};

export default page;
