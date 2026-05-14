// components/ValidatedInput.js
// validacao dos campos

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

/**
 * Props:
 *  - label: string
 *  - value: string
 *  - onChangeText: (texto: string) => void
 *  - erro: string       — mensagem de erro (vazia = campo válido)
 *  - obrigatorio: bool
 *  - placeholder: string
 *  - keyboardType: string
 *  - autoCapitalize: string
 *  - secureTextEntry: bool
 *  - maxLength: number
 *  - editable: bool
 *  - multiline: bool
 *  - numberOfLines: number
 *  - style: object      — estilo extra para o input
 */
export default function ValidatedInput({
  label, 
  value,
  onChangeText,
  erro = '',
  obrigatorio = false,
  placeholder = '',
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  maxLength,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style,
}) {
  const temErro = !!erro;

  return (
    <View style={estilos.wrapper}>
      {label ? (
        <Text style={estilos.label}>
          {label}
          {obrigatorio && <Text style={estilos.asterisco}> *</Text>}
        </Text>
      ) : null}

      <TextInput
        style={[
          estilos.input,
          temErro && estilos.inputErro,
          multiline && { minHeight: 80, textAlignVertical: 'top' },
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
      />

      {temErro && (
        <Text style={estilos.textoErro}>⚠ {erro}</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 5,
    marginTop: 10,
  },
  asterisco: {
    color: '#e94560',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  inputErro: {
    borderColor: '#e94560',
    borderWidth: 1.5,
    backgroundColor: '#1a0a10',
  },
  textoErro: {
    color: '#e94560',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
