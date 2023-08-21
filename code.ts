const styles = figma.getLocalPaintStyles();
const tokenDataMap = styles.reduce(styleToTokenDataMap, {});
const tokenData = Object.values(tokenDataMap);

const shadeMapping = {
  "50": "100",
  "100": "200",
  "200": "300",
  "300": "400",
  "400": "500",
  "500": "600",
  "600": "700",
  "700": "800",
  "800": "900",
  "900": "1000",
  "1000": "1100",
  "1200": "1200",
};

function styleToTokenDataMap(into, current) {
  const paints = current.paints.filter(
    ({ visible, type }) => visible && type === "SOLID"
  );
  if (paints.length === 1) {
    const {
      blendMode,
      color: { r, g, b },
      opacity,
      type,
    } = paints[0];
    const hex = rgbToHex({ r, g, b });
    if (blendMode === "NORMAL") {
      const uniqueId = [hex, opacity].join("-");
      into[uniqueId] = into[uniqueId] || {
        color: { r, g, b },
        hex,
        opacity,
        tokens: [],
      };
      into[uniqueId].tokens.push(current.name);
    } else {
      // do something different i guess
    }
  }
  return into;

  function rgbToHex({ r, g, b }) {
    const toHex = (value) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    const hex = [toHex(r), toHex(g), toHex(b)].join("");
    return `#${hex}`;
  }
}

function createMainColours(tokenData) {
  if (tokenData.length <= 0) {
    figma.notify("No convertible styles found. :(");
    return;
  }
  const collection = figma.variables.createVariableCollection(`Main Colors`);
  const modeId = collection.modes[0].modeId;
  collection.renameMode(modeId, "Name");

  const colorsObject: {
    [key: string]: any[];
  } = {
    Tomato: [],
    Red: [],
    Crimson: [],
    Pink: [],
    Plum: [],
    Purple: [],
    Violet: [],
    Indigo: [],
    Blue: [],
    Cyan: [],
    Teal: [],
    Green: [],
    Grass: [],
    Orange: [],
    Brown: [],
    Sky: [],
    Mint: [],
    Lime: [],
    Yellow: [],
    Amber: [],
    Gray: [],
    Mauve: [],
    Slate: [],
    Sage: [],
    Olive: [],
    Sand: [],
    Gold: [],
    Bronze: [],
  };

  Object.keys(colorsObject).forEach((color) => {
    colorsObject[color] = tokenData
      .filter(({ tokens, opacity }) => {
        const splitTokens = tokens[0].split("/");
        return splitTokens[0] === color && opacity === 1;
      })
      .sort(
        (a, b) =>
          parseInt(a.tokens[0].split("/")[2]) -
          parseInt(b.tokens[0].split("/")[2])
      );
  });

  Object.keys(colorsObject).forEach((key) => {
    colorsObject[key].forEach(({ tokens, color, opacity }) => {
      tokens.forEach((token) => {
        const splitToken = token.split("/");
        splitToken[2] = shadeMapping[splitToken[2]] || splitToken[2];
        const newName = splitToken.join("/");

        const colourVariable = figma.variables.createVariable(
          newName,
          collection.id,
          "COLOR"
        );
        colourVariable.setValueForMode(modeId, {
          r: color.r,
          g: color.g,
          b: color.b,
          a: opacity,
        });
      });
    });
  });
}

function createLightAndDarkColours() {
  const colours = figma.variables.getLocalVariables("COLOR");

  const collection = figma.variables.createVariableCollection(`Theme Colors`);

  const lightModeId = collection.modes[0].modeId;
  collection.renameMode(lightModeId, "Light");
  const darkModeId = collection.addMode("Dark");

  colours.forEach((colour, i) => {
    const colours = figma.variables.getLocalVariables("COLOR");

    const splitName = colour.name.split("/");
    const newName = splitName[0] + "/" + splitName[2];
    const modeId = splitName[1] === "Light" ? lightModeId : darkModeId;

    const existingVariableId = colours.find(
      (variable) => variable.name === newName
    )?.id;

    const existingToken = existingVariableId
      ? figma.variables.getVariableById(existingVariableId)
      : undefined;

    if (existingToken) {
      console.log("Token already exists: ", existingToken, i);

      existingToken.setValueForMode(modeId, {
        type: "VARIABLE_ALIAS",
        id: colour.id,
      });
    } else {
      console.log("Token doesn't exist, creating...", i);

      const token = figma.variables.createVariable(
        newName,
        collection.id,
        "COLOR"
      );

      token.setValueForMode(modeId, {
        type: "VARIABLE_ALIAS",
        id: colour.id,
      });
    }
  });
}

// createMainColours(tokenData);

createLightAndDarkColours();

figma.closePlugin();
