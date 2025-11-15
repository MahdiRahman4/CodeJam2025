import React from "react";
import { View, Text, TextInput } from "react-native";


export default function SearchBar() {
  return (
    <View style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, margin: 10 }}>
      <TextInput
        placeholder="Search..."
        style={{ height: 40, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 4 }}
      />
    </View>
  );
}