package com.smartcrop.service;

import java.util.Locale;
import java.util.Map;

/** Typical growing season (India) for each crop the model can predict - shown next to the result. */
public final class CropInfo {
    private CropInfo() {}

    private static final Map<String, String> SEASON = Map.ofEntries(
            Map.entry("rice", "Kharif (monsoon)"),
            Map.entry("maize", "Kharif / Rabi"),
            Map.entry("jute", "Kharif (monsoon)"),
            Map.entry("cotton", "Kharif (monsoon)"),
            Map.entry("coconut", "Perennial (year-round)"),
            Map.entry("papaya", "Year-round"),
            Map.entry("orange", "Perennial (fruit in winter)"),
            Map.entry("apple", "Perennial (cool climate)"),
            Map.entry("muskmelon", "Zaid (summer)"),
            Map.entry("watermelon", "Zaid (summer)"),
            Map.entry("grapes", "Perennial"),
            Map.entry("mango", "Perennial (fruit in summer)"),
            Map.entry("banana", "Year-round"),
            Map.entry("pomegranate", "Perennial"),
            Map.entry("lentil", "Rabi (winter)"),
            Map.entry("blackgram", "Kharif / Zaid"),
            Map.entry("mungbean", "Kharif / Zaid"),
            Map.entry("mothbeans", "Kharif (monsoon)"),
            Map.entry("pigeonpeas", "Kharif (monsoon)"),
            Map.entry("kidneybeans", "Kharif / Rabi"),
            Map.entry("chickpea", "Rabi (winter)"),
            Map.entry("coffee", "Perennial (plantation)"));

    public static String season(String crop) {
        return crop == null ? null : SEASON.get(crop.toLowerCase(Locale.ROOT));
    }
}
