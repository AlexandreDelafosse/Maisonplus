// src/components/Checkbox.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CheckboxProps {
  value: boolean;
  onValueChange: () => void;
  label?: string;
}

export default function Checkbox({ value, onValueChange, label }: CheckboxProps) {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onValueChange}>
      <Text style={[styles.box, value && styles.checked]}>{value ? '✓' : ''}</Text>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 10,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: 'bold',
  },
  checked: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  label: {
    fontSize: 16,
  },
});
